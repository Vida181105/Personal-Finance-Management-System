'use client';

import { useState, useEffect } from 'react';
import { budgetService, SavingsGoal, BudgetOptimizationPlan } from '@/services/budget';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'];

const STORAGE_KEY = 'budget_optimizer_goals';

export default function BudgetOptimizerPage() {
  useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', priority: 3, deadline_months: 6 });
  const [optimizationPlan, setOptimizationPlan] = useState<BudgetOptimizationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Persist goals to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch {
      // ignore storage errors
    }
  }, [goals]);

  const addGoal = () => {
    if (!newGoal.name.trim() || !newGoal.target_amount) {
      setError('Goal name and target amount are required');
      return;
    }
    const goal: SavingsGoal = {
      name: newGoal.name.trim(),
      target_amount: parseFloat(newGoal.target_amount as string),
      priority: newGoal.priority,
      deadline_months: newGoal.deadline_months,
    };
    setGoals([...goals, goal]);
    setNewGoal({ name: '', target_amount: '', priority: 3, deadline_months: 6 });
    setError('');
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
    if (optimizationPlan) setOptimizationPlan(null);
  };

  const optimizeBudget = async () => {
    if (goals.length === 0) {
      setError('Add at least one savings goal');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const plan = await budgetService.optimizeBudget(goals);
      if (!plan || !plan.allocation_plan) {
        throw new Error('Invalid response from optimizer. Please try again.');
      }
      setOptimizationPlan(plan);
    } catch (err: any) {
      setError(err.message || 'Failed to optimize budget');
    } finally {
      setLoading(false);
    }
  };

  const allocationChartData = optimizationPlan?.allocation_plan?.map((a) => ({
    name: a.category,
    value: a.allocated_amount,
    percentage: a.percentage,
  })) ?? [];

  const priorityLabel = (p: number) =>
    p === 5 ? 'Very High' : p === 4 ? 'High' : p === 3 ? 'Medium' : p === 2 ? 'Low' : 'Very Low';

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Optimizer</h1>
        <p className="text-gray-600 mb-8">Allocate your savings across goals to maximize achievement</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Savings Goal</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                  <Input
                    placeholder="e.g., Emergency Fund"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 100000"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[5, 4, 3, 2, 1].map((p) => (
                      <option key={p} value={p}>{p} — {priorityLabel(p)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (Months)</label>
                  <Input
                    type="number"
                    min="1"
                    value={newGoal.deadline_months}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline_months: parseInt(e.target.value) })}
                  />
                </div>

                <Button onClick={addGoal} className="w-full">
                  + Add Goal
                </Button>
              </div>

              <Button
                onClick={optimizeBudget}
                className="w-full"
                disabled={goals.length === 0 || loading}
              >
                {loading ? 'Optimizing...' : 'Optimize Budget'}
              </Button>
            </div>
          </div>

          {/* Right: Goals List + Results */}
          <div className="lg:col-span-2 space-y-6">

            {/* Goals list always shown on right */}
            {goals.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Savings Goals ({goals.length})
                </h2>
                <div className="space-y-3">
                  {goals.map((goal, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{goal.name}</p>
                        <p className="text-sm text-gray-500">
                          Target: ₹{goal.target_amount.toLocaleString()} &nbsp;|&nbsp;
                          Deadline: {goal.deadline_months} month{goal.deadline_months !== 1 ? 's' : ''} &nbsp;|&nbsp;
                          Priority: {priorityLabel(goal.priority)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeGoal(idx)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium ml-4"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {!optimizationPlan && (
                  <p className="text-sm text-gray-400 mt-4 text-center">
                    Click "Optimize Budget" to generate your plan
                  </p>
                )}
              </div>
            )}

            {/* No goals yet */}
            {goals.length === 0 && !optimizationPlan && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg font-medium">No goals added yet</p>
                <p className="text-gray-400 text-sm mt-1">Add at least one goal on the left to get started</p>
              </div>
            )}

            {/* Optimization Results */}
            {optimizationPlan && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <p className="text-sm text-indigo-600 font-medium">Monthly Income</p>
                    <p className="text-2xl font-bold text-indigo-900">₹{optimizationPlan.total_income.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Total Allocated</p>
                    <p className="text-2xl font-bold text-green-900">₹{optimizationPlan.total_allocated.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">Savings Potential</p>
                    <p className="text-2xl font-bold text-purple-900">₹{optimizationPlan.total_savings_potential.toLocaleString()}</p>
                  </div>
                </div>

                {/* Summary text (strip emojis) */}
                {optimizationPlan.summary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      {optimizationPlan.summary.replace(/[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|⚠️|💰|🚀|📋/gu, '').trim()}
                    </p>
                  </div>
                )}

                {/* Pie Chart */}
                {allocationChartData.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Allocation</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={allocationChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={1}
                          dataKey="value"
                        >
                          {allocationChartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `₹${(v as number).toLocaleString()}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Goal Achievement Probabilities */}
                {Object.keys(optimizationPlan.goal_achievement_probability).length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Achievement Probability</h3>
                    <div className="space-y-3">
                      {Object.entries(optimizationPlan.goal_achievement_probability).map(([goal, prob]) => (
                        <div key={goal} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 w-1/2">{goal}</span>
                          <div className="flex items-center gap-3 flex-1 justify-end">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${(prob as number) >= 0.7 ? 'bg-green-500' : (prob as number) >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                style={{ width: `${(prob as number) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-10 text-right">
                              {((prob as number) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Allocation Table */}
                {optimizationPlan.allocation_plan.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Allocation</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-700">Category</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-700">Amount</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-700">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {optimizationPlan.allocation_plan.map((alloc, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-900">{alloc.category}</td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                ₹{alloc.allocated_amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-right text-gray-600">{alloc.percentage.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
