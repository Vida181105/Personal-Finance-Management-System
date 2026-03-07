import api from './api';

export interface AgentContext {
    userId: string;
    contextVersion: number;
    sharedContext: {
        financial_analyzer?: any;
        goal_optimizer?: any;
        alert_monitor?: any;
        insight_generator?: any;
    };
    agentStates: {
        [key: string]: {
            status: 'idle' | 'running' | 'completed' | 'failed';
            lastRun?: string;
            error?: string;
        };
    };
    recommendations: any[];
    alerts: any[];
    updatedAt: string;
}

export interface AgentMessage {
    id: string;
    type: 'TASK' | 'FINDINGS' | 'ALERT' | 'RECOMMENDATION' | 'ESCALATION' | 'REPORT';
    from: string;
    to: string;
    priority: number;
    payload: any;
    createdAt: string;
    status?: string;
    processedAt?: string;
}

export const agentService = {
    // Run full orchestration cycle
    runAgents: async () => {
        const response = await api.post('/agents/run');
        return response.data.data;
    },

    // Get latest context
    getContext: async () => {
        const response = await api.get('/agents/context');
        return response.data.data as AgentContext;
    },

    // Get recent messages
    getMessages: async (limit: number = 30) => {
        const response = await api.get(`/agents/messages?limit=${limit}`);
        return response.data.data as AgentMessage[];
    },

    // Get agent states
    getState: async () => {
        const response = await api.get('/agents/state');
        return response.data.data;
    }
};
