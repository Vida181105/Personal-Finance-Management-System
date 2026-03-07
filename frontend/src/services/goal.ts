import api from './api';

export interface Goal {
    _id: string;
    userId: string;
    name: string;
    description?: string;
    type: 'savings' | 'debt_payoff' | 'investment';
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    priority: number;
    status: 'active' | 'completed' | 'paused' | 'cancelled';
    milestones: Milestone[];
    progressPercentage: number;
    daysRemaining: number;
    monthlyTarget: number;
    createdAt: string;
    updatedAt: string;
}

export interface Milestone {
    percentage: number;
    targetAmount: number;
    achieved: boolean;
    achievedDate?: string;
}

export interface GoalStats {
    activeGoals: number;
    completedGoals: number;
    totalSaved: number;
    upcomingDeadlines: {
        id: string;
        name: string;
        deadline: string;
        daysRemaining: number;
        progress: number;
    }[];
}

export const goalService = {
    // Get all goals
    getGoals: async (filters?: { status?: string; type?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.type) params.append('type', filters.type);

        const query = params.toString();
        const response = await api.get(`/goals${query ? `?${query}` : ''}`);
        return response.data.data.goals as Goal[];
    },

    // Get single goal
    getGoalById: async (id: string) => {
        const response = await api.get(`/goals/${id}`);
        return response.data.data.goal as Goal;
    },

    // Create goal
    createGoal: async (goalData: {
        name: string;
        description?: string;
        type: 'savings' | 'debt_payoff' | 'investment';
        targetAmount: number;
        currentAmount?: number;
        deadline: string;
        priority?: number;
    }) => {
        const response = await api.post('/goals', goalData);
        return response.data.data.goal as Goal;
    },

    // Update goal
    updateGoal: async (id: string, updates: Partial<Goal>) => {
        const response = await api.put(`/goals/${id}`, updates);
        return response.data.data.goal as Goal;
    },

    // Update progress
    updateProgress: async (id: string, amount: number) => {
        const response = await api.patch(`/goals/${id}/progress`, { amount });
        return {
            goal: response.data.data.goal as Goal,
            newMilestones: response.data.data.newMilestones as number[]
        };
    },

    // Delete goal
    deleteGoal: async (id: string) => {
        await api.delete(`/goals/${id}`);
    },

    // Get statistics
    getStats: async () => {
        const response = await api.get('/goals/stats');
        return response.data.data as GoalStats;
    }
};
