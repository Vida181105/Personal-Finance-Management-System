'use client';

import React, { useEffect, useState } from 'react';
import { goalService, Goal, GoalStats } from '@/services/goal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [stats, setStats] = useState<GoalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/auth/login');
            return;
        }
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [goalsData, statsData] = await Promise.all([
                goalService.getGoals({ status: 'active' }),
                goalService.getStats()
            ]);
            setGoals(goalsData);
            setStats(statsData);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to load goals', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGoal = async (data: any) => {
        try {
            await goalService.createGoal(data);
            showToast('Goal created successfully!', 'success');
            setShowCreateModal(false);
            loadData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to create goal', 'error');
        }
    };

    const handleUpdateProgress = async (goalId: string, amount: number) => {
        try {
            const result = await goalService.updateProgress(goalId, amount);
            if (result.newMilestones.length > 0) {
                showToast(`🎉 Milestone achieved: ${result.newMilestones[0]}%!`, 'success');
            } else {
                showToast('Progress updated!', 'success');
            }
            loadData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update progress', 'error');
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Goals</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Track your savings and debt payoff progress</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Goal
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <StatCard
                        title="Active Goals"
                        value={stats.activeGoals}
                        icon="🎯"
                        color="blue"
                    />
                    <StatCard
                        title="Completed Goals"
                        value={stats.completedGoals}
                        icon="✅"
                        color="green"
                    />
                    <StatCard
                        title="Total Saved"
                        value={`₹${stats.totalSaved.toLocaleString()}`}
                        icon="💰"
                        color="purple"
                    />
                </div>
            )}

            {/* Goals List */}
            <div className="space-y-4">
                {goals.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No active goals yet</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                            Create Your First Goal
                        </button>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <GoalCard
                            key={goal._id}
                            goal={goal}
                            onUpdateProgress={handleUpdateProgress}
                        />
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateGoalModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateGoal}
                />
            )}
        </div>
    );
}

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({
    title,
    value,
    icon,
    color
}) => {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                </div>
                <div className={`text-3xl ${colorClasses[color as keyof typeof colorClasses]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const GoalCard: React.FC<{
    goal: Goal;
    onUpdateProgress: (id: string, amount: number) => void;
}> = ({ goal, onUpdateProgress }) => {
    const [showAddProgress, setShowAddProgress] = useState(false);
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseFloat(amount);
        if (value > 0) {
            onUpdateProgress(goal._id, value);
            setAmount('');
            setShowAddProgress(false);
        }
    };

    const typeColors = {
        savings: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        debt_payoff: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        investment: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[goal.type]}`}>
                            {goal.type.replace('_', ' ')}
                        </span>
                    </div>
                    {goal.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{goal.description}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {goal.progressPercentage.toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {goal.daysRemaining > 0 ? `${goal.daysRemaining} days left` : 'Overdue'}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>₹{goal.currentAmount.toLocaleString()}</span>
                    <span>₹{goal.targetAmount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                    />
                </div>
            </div>

            {/* Milestones */}
            <div className="flex gap-2 mb-4">
                {goal.milestones.map((milestone) => (
                    <div
                        key={milestone.percentage}
                        className={`flex-1 text-center p-2 rounded ${milestone.achieved
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        <div className="text-xs font-medium">{milestone.percentage}%</div>
                        {milestone.achieved && <div className="text-xs">✓</div>}
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                {showAddProgress ? (
                    <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount to add"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAddProgress(false)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setShowAddProgress(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                        Add Progress
                    </button>
                )}
            </div>

            {/* Monthly Target */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    💡 Monthly target: <span className="font-medium text-gray-900 dark:text-white">₹{goal.monthlyTarget.toLocaleString()}</span> to reach goal on time
                </p>
            </div>
        </div>
    );
};

const CreateGoalModal: React.FC<{
    onClose: () => void;
    onCreate: (data: any) => void;
}> = ({ onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'savings',
        targetAmount: '',
        currentAmount: '0',
        deadline: '',
        priority: '3',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({
            ...formData,
            targetAmount: parseFloat(formData.targetAmount),
            currentAmount: parseFloat(formData.currentAmount),
            priority: parseInt(formData.priority),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Goal</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Goal Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                            placeholder="e.g., Emergency Fund"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type *
                        </label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                        >
                            <option value="savings">Savings</option>
                            <option value="debt_payoff">Debt Payoff</option>
                            <option value="investment">Investment</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Amount (₹) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.targetAmount}
                            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                            placeholder="50000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deadline *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (optional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                            rows={3}
                            placeholder="Brief description of your goal"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                            Create Goal
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
