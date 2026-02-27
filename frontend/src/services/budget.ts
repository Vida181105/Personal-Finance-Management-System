import api from './api';

export interface SavingsGoal {
  name: string;
  target_amount: number;
  priority: number;
  deadline_months: number;
}

export interface BudgetAllocation {
  category: string;
  allocated_amount: number;
  percentage: number;
}

export interface BudgetOptimizationPlan {
  userId: string;
  allocation_plan: BudgetAllocation[];
  total_income: number;
  total_allocated: number;
  total_savings_potential: number;
  goal_achievement_probability: Record<string, number>;
  summary: string;
}

export interface SpendingSummary {
  month: string;
  totalExpense: number;
  categoryBreakdown: Record<string, any>;
  transactionCount: number;
}

export const budgetService = {
  async optimizeBudget(savingsGoals: SavingsGoal[]): Promise<BudgetOptimizationPlan> {
    const response = await api.post('/budget/optimize', {
      savingsGoals,
      minimumExpenseRatio: 0.7,
    });
    // ResponseHandler wraps data as { success, message, data: plan }
    return response.data.data ?? response.data;
  },

  async getSpendingSummary(userId: string): Promise<SpendingSummary> {
    const response = await api.get(`/budget/summary/${userId}`);
    return response.data;
  },
};
