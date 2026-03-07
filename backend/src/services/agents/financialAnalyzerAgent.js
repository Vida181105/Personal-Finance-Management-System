const axios = require('axios');
const Transaction = require('../../models/Transaction');
const { createAgentMessage, MESSAGE_TYPES } = require('./messageProtocol');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

function sumByCategory(transactions) {
    return transactions.reduce((acc, tx) => {
        const key = tx.category || 'Uncategorized';
        acc[key] = (acc[key] || 0) + Number(tx.amount || 0);
        return acc;
    }, {});
}

async function runFinancialAnalyzerAgent({ userId }) {
    const now = new Date();
    const last90 = new Date(now);
    last90.setDate(now.getDate() - 90);

    const transactions = await Transaction.find({ userId, date: { $gte: last90 } })
        .select('date amount type category merchantName description')
        .sort({ date: -1 })
        .lean();

    const expenses = transactions.filter((tx) => tx.type === 'Expense');
    const totalExpense = expenses.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const categoryTotals = sumByCategory(expenses);

    const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount }));

    let anomalyCount = 0;
    let trendSummary = null;
    let clusterSummary = null;

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
            anomalyCount = anomaliesResp.data?.anomalies?.length || 0;
        }

        if (transactions.length >= 10) {
            const forecastResp = await axios.post(`${ML_SERVICE_URL}/forecast`, {
                userId,
                transactions: [...transactions]
                    .reverse()
                    .map((t) => ({
                        date: new Date(t.date).toISOString(),
                        amount: t.amount,
                        type: t.type,
                        category: t.category,
                        merchantName: t.merchantName || 'Unknown',
                    })),
                forecast_days: 30,
            });
            trendSummary = forecastResp.data?.trend_analysis || null;
        }

        if (transactions.length >= 10) {
            const clusterResp = await axios.post(`${ML_SERVICE_URL}/cluster`, {
                userId,
                n_clusters: 5,
                transactions: transactions.map((t) => ({
                    date: new Date(t.date).toISOString(),
                    amount: t.amount,
                    type: t.type,
                    category: t.category,
                    merchantName: t.merchantName || 'Unknown',
                })),
            });
            clusterSummary = {
                clustersFound: clusterResp.data?.n_clusters || 0,
                patterns: clusterResp.data?.pattern_labels || [],
            };
        }
    } catch (error) {
        // Fail-open: agent still publishes deterministic analytics.
        trendSummary = trendSummary || { note: `ML service unavailable: ${error.message}` };
    }

    const recommendations = [];
    if (topCategories.length > 0) {
        recommendations.push({
            sourceAgent: 'financialAnalyzer',
            title: `Review top spend: ${topCategories[0].category}`,
            detail: `Your highest spending category in the last 90 days is ${topCategories[0].category}.`,
            priority: 4,
            severity: 'medium',
            tags: ['spending', 'category-analysis'],
            createdAt: new Date(),
            resolved: false,
        });
    }

    if (anomalyCount > 0) {
        recommendations.push({
            sourceAgent: 'financialAnalyzer',
            title: 'Validate unusual transactions',
            detail: `${anomalyCount} potentially unusual transactions were detected.`,
            priority: 5,
            severity: anomalyCount > 5 ? 'high' : 'medium',
            tags: ['anomaly', 'risk'],
            createdAt: new Date(),
            resolved: false,
        });
    }

    return {
        agentContextPatch: {
            summary: {
                transactionCount: transactions.length,
                expenseCount: expenses.length,
                totalExpense,
                topCategories,
                anomalyCount,
            },
            trends: trendSummary,
            clusters: clusterSummary,
            generatedAt: new Date(),
        },
        recommendations,
        alerts: anomalyCount > 5
            ? [{
                sourceAgent: 'financialAnalyzer',
                title: 'High anomaly volume detected',
                message: `${anomalyCount} anomalies detected in recent transactions.`,
                severity: 'high',
                category: 'anomaly',
                escalated: true,
                createdAt: new Date(),
            }]
            : [],
        messages: [
            createAgentMessage({
                from: 'financialAnalyzer',
                to: 'coordinator',
                type: MESSAGE_TYPES.FINDINGS,
                priority: 4,
                payload: { topCategories, anomalyCount, transactionCount: transactions.length },
            }),
        ],
        statePatch: {
            status: 'completed',
            lastMessage: 'Financial analysis complete',
            error: null,
        },
    };
}

module.exports = {
    runFinancialAnalyzerAgent,
};
