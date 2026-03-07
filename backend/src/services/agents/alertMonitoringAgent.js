const axios = require('axios');
const Transaction = require('../../models/Transaction');
const { createAgentMessage, MESSAGE_TYPES } = require('./messageProtocol');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const BILL_CATEGORIES = new Set(['Utilities', 'Rent', 'Insurance']);

function daysUntil(date) {
    const now = new Date();
    const diff = new Date(date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function computeUpcomingBills(transactions) {
    const recurringLike = transactions.filter((tx) => tx.isRecurring || BILL_CATEGORIES.has(tx.category));
    const byMerchant = new Map();

    for (const tx of recurringLike) {
        const merchant = tx.merchantName || tx.category || 'Unknown';
        const existing = byMerchant.get(merchant);
        if (!existing || new Date(tx.date) > new Date(existing.date)) {
            byMerchant.set(merchant, tx);
        }
    }

    const due = [];
    for (const [merchant, tx] of byMerchant.entries()) {
        const prevDate = new Date(tx.date);
        const nextDue = new Date(prevDate);
        nextDue.setMonth(nextDue.getMonth() + 1);

        const dueInDays = daysUntil(nextDue);
        if (dueInDays >= 0 && dueInDays <= 14) {
            due.push({
                merchant,
                category: tx.category,
                amount: tx.amount,
                nextDueDate: nextDue,
                dueInDays,
            });
        }
    }

    return due.sort((a, b) => a.dueInDays - b.dueInDays);
}

async function runAlertMonitoringAgent({ userId }) {
    const now = new Date();
    const last60 = new Date(now);
    last60.setDate(now.getDate() - 60);

    const transactions = await Transaction.find({ userId, date: { $gte: last60 } })
        .select('date amount type category merchantName isRecurring anomaly_score is_anomaly')
        .sort({ date: -1 })
        .lean();

    const alerts = [];
    let anomalyCount = 0;

    try {
        if (transactions.length >= 5) {
            const anomaliesResp = await axios.post(`${ML_SERVICE_URL}/anomalies`, {
                userId,
                transactions: transactions.map((t) => ({
                    date: new Date(t.date).toISOString(),
                    amount: t.amount,
                    type: t.type,
                    category: t.category,
                    merchantName: t.merchantName || 'Unknown',
                })),
                contamination: 0.1,
            });

            const mlAnomalies = anomaliesResp.data?.anomalies || [];
            anomalyCount = mlAnomalies.length;
            if (anomalyCount > 0) {
                alerts.push({
                    sourceAgent: 'alertMonitoring',
                    title: 'Unusual activity detected',
                    message: `${anomalyCount} potentially anomalous transactions found.`,
                    severity: anomalyCount >= 8 ? 'critical' : anomalyCount >= 4 ? 'high' : 'medium',
                    category: 'anomaly',
                    escalated: anomalyCount >= 8,
                    createdAt: new Date(),
                });
            }
        }
    } catch (error) {
        alerts.push({
            sourceAgent: 'alertMonitoring',
            title: 'Monitoring degraded',
            message: `Anomaly detector unavailable: ${error.message}`,
            severity: 'medium',
            category: 'system',
            escalated: false,
            createdAt: new Date(),
        });
    }

    const dueBills = computeUpcomingBills(transactions);
    for (const bill of dueBills.slice(0, 10)) {
        const severity = bill.dueInDays <= 2 ? 'critical' : bill.dueInDays <= 7 ? 'high' : 'medium';
        alerts.push({
            sourceAgent: 'alertMonitoring',
            title: `Upcoming bill: ${bill.merchant}`,
            message: `${bill.category || 'Bill'} due in ${bill.dueInDays} day(s) for approx ${bill.amount}.`,
            severity,
            category: 'bill_due',
            escalated: severity === 'critical',
            createdAt: new Date(),
        });
    }

    const escalatedCount = alerts.filter((a) => a.escalated).length;

    return {
        agentContextPatch: {
            anomalyCount,
            dueBills,
            alertCount: alerts.length,
            escalatedCount,
            generatedAt: new Date(),
        },
        recommendations: dueBills.length > 0
            ? [{
                sourceAgent: 'alertMonitoring',
                title: 'Enable bill buffer strategy',
                detail: 'Keep a buffer in account 2 days before expected recurring bill dates.',
                priority: 5,
                severity: 'medium',
                tags: ['bills', 'cashflow'],
                createdAt: new Date(),
                resolved: false,
            }]
            : [],
        alerts,
        messages: [
            createAgentMessage({
                from: 'alertMonitoring',
                to: 'coordinator',
                type: escalatedCount > 0 ? MESSAGE_TYPES.ESCALATION : MESSAGE_TYPES.ALERT,
                priority: escalatedCount > 0 ? 5 : 4,
                payload: {
                    alertCount: alerts.length,
                    escalatedCount,
                    anomalyCount,
                },
            }),
        ],
        statePatch: {
            status: 'completed',
            lastMessage: 'Alert monitoring cycle complete',
            error: null,
        },
    };
}

module.exports = {
    runAlertMonitoringAgent,
};
