'use client';

import React, { useEffect, useState } from 'react';
import { agentService, AgentContext } from '@/services/agent';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AgentInsightsPage() {
    const [context, setContext] = useState<AgentContext | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/auth/login');
            return;
        }
        loadContext();
    }, [user]);

    const loadContext = async () => {
        try {
            setLoading(true);
            const data = await agentService.getContext();
            setContext(data);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to load insights', 'error');
        } finally {
            setLoading(false);
        }
    };

    const runAgents = async () => {
        try {
            setRunning(true);
            showToast('Running AI agents...', 'info');
            await agentService.runAgents();
            showToast('✨ Agent analysis complete!', 'success');
            loadContext();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to run agents', 'error');
        } finally {
            setRunning(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
                    <p className="text-gray-600 mt-1">
                        Multi-agent financial analysis powered by ML
                    </p>
                </div>
                <button
                    onClick={runAgents}
                    disabled={running}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    {running ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Running...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Run Analysis
                        </>
                    )}
                </button>
            </div>

            {context && (
                <>
                    {/* Agent Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {Object.entries(context.agentStates || {}).map(([key, state]) => (
                            <div key={key} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-900 capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </h3>
                                    <StatusBadge status={state.status} />
                                </div>
                                {state.lastRun && (
                                    <p className="text-xs text-gray-500">
                                        Last run: {new Date(state.lastRun).toLocaleString()}
                                    </p>
                                )}
                                {state.error && (
                                    <p className="text-xs text-red-500 mt-1">{state.error}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Recommendations */}
                    {context.recommendations && context.recommendations.length > 0 && (
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Recommendations</h2>
                            <div className="space-y-3">
                                {context.recommendations.slice(0, 5).map((rec, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                        <span className="text-blue-600 mt-0.5">→</span>
                                        <div className="flex-1">
                                            <p className="text-gray-900">{rec.title || rec.message}</p>
                                            {rec.impact && (
                                                <p className="text-sm text-gray-600 mt-1">{rec.impact}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Alerts */}
                    {context.alerts && context.alerts.length > 0 && (
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">🚨 Alerts</h2>
                            <div className="space-y-3">
                                {context.alerts.slice(0, 5).map((alert, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-start gap-3 p-3 rounded-lg ${alert.severity === 'critical'
                                                ? 'bg-red-50'
                                                : alert.severity === 'high'
                                                    ? 'bg-orange-50'
                                                    : 'bg-yellow-50'
                                            }`}
                                    >
                                        <span className="text-xl">{alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🟠' : '🟡'}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{alert.title || alert.message}</p>
                                            {alert.description && (
                                                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Context Version */}
                    <div className="text-center text-sm text-gray-500">
                        Context Version: {context.contextVersion} • Last Updated: {new Date(context.updatedAt).toLocaleString()}
                    </div>
                </>
            )}

            {!context && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No insights available yet</p>
                    <button
                        onClick={runAgents}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                        Generate First Insights
                    </button>
                </div>
            )}
        </div>
    );
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors = {
        idle: 'bg-gray-100 text-gray-700',
        running: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || colors.idle}`}>
            {status}
        </span>
    );
};
