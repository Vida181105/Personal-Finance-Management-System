const axios = require('axios');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const { createAgentMessage, MESSAGE_TYPES } = require('./messageProtocol');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

function averageMonthlyByCategory(transactions) {
    if (transactions.length === 0) {
        return {};
    }

    const totals = {};
    const months = new Set();

    for (const tx of transactions) {
        const d = new Date(tx.date);
        months.add(`${d.getFullYear()}-${d.getMonth()}`);
        const category = tx.category || 'Other';
        totals[category] = (totals[category] || 0) + Number(tx.amount || 0);
    }

    const monthCount = Math.max(1, months.size);
    return Object.entries(totals).reduce((acc, [category, total]) => {
        acc[category] = Math.round(total / monthCount);
        return acc;
    }, {});
}

async function runGoalOptimizerAgent({ userId, goals = [] }) {
    const now = new Date();
    const last90 = new Date(now);
    last90.setDate(now.getDate() - 90);

    const [user, expenses] = await Promise.all([
        User.findOne({ userId }).select('monthlyIncome').lean(),
        Transaction.find({ userId, type: 'Expense', date: { $gte: last90 } })
            .select('date amount category')
            .lean(),
    ]);

    const monthlyIncome = Number(user?.monthlyIncome || 0);
    const expenseCategories = averageMonthlyByCategory(expenses);

    let optimizationPlan = null;
    try {
        const resp = await axios.post(`${ML_SERVICE_URL}/optimize-budget`, {
            userId,
            monthly_income: monthlyIncome,
            expense_categories: expenseCategories,
            savings_goals: goals,
            minimum_expense_ratio: 0.7,
        });
        optimizationPlan = resp.data;
    } catch (error) {
        optimizationPlan = {
            note: `Optimization service unavailable: ${error.message}`,
            monthly_income: monthlyIncome,
            expense_categories: expenseCategories,
            savings_goals: goals,
        };
    }

    const recommendations = [
        {
            sourceAgent: 'goalOptimizer',
            title: 'Follow optimized monthly allocation',
            detail: 'Use the optimized category caps and goal allocation for your next cycle.',
            priority: 4,
            severity: 'medium',
            tags: ['budget', 'goals'],
            createdAt: new Date(),
            resolved: false,
        },
    ];

    if (Array.isArray(goals) && goals.length > 0) {
        recommendations.push({
            sourceAgent: 'goalOptimizer',
            title: 'Track milestone checkpoints',
            detail: `Track ${goals.length} savings goal milestones weekly and rebalance if behind schedule.`,
            priority: 3,
            severity: 'low',
            tags: ['milestones', 'tracking'],
            createdAt: new Date(),
            resolved: false,
        });
    }

    return {
        agentContextPatch: {
            optimizationPlan,
            monthlyIncome,
            goals,
            generatedAt: new Date(),
        },
        recommendations,
        alerts: [],
        messages: [
            createAgentMessage({
                from: 'goalOptimizer',
                to: 'coordinator',
                type: MESSAGE_TYPES.RECOMMENDATION,
                priority: 4,
                payload: {
                    hasPlan: !!optimizationPlan,
                    goalCount: goals.length,
                },
            }),
        ],
        statePatch: {
            status: 'completed',
            lastMessage: 'Goal optimization complete',
            error: null,
        },
    };
}

module.exports = {
    runGoalOptimizerAgent,
};
