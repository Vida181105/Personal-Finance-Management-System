const queue = require('./messageQueue');
const contextService = require('./contextService');
const { createAgentMessage, MESSAGE_TYPES } = require('./messageProtocol');
const { runFinancialAnalyzerAgent } = require('./financialAnalyzerAgent');
const { runGoalOptimizerAgent } = require('./goalOptimizerAgent');
const { runAlertMonitoringAgent } = require('./alertMonitoringAgent');
const { runInsightGenerationAgent } = require('./insightGenerationAgent');

const AGENTS = {
    financialAnalyzer: runFinancialAnalyzerAgent,
    goalOptimizer: runGoalOptimizerAgent,
    alertMonitoring: runAlertMonitoringAgent,
    insightGeneration: runInsightGenerationAgent,
};

function severityWeight(severity) {
    switch (severity) {
        case 'critical':
            return 4;
        case 'high':
            return 3;
        case 'medium':
            return 2;
        default:
            return 1;
    }
}

function prioritizeRecommendations(recommendations = []) {
    const dedup = new Map();

    for (const rec of recommendations) {
        const key = `${rec.title}::${rec.sourceAgent}`;
        const score = (rec.priority || 3) + severityWeight(rec.severity);
        const previous = dedup.get(key);
        if (!previous || previous.__score < score) {
            dedup.set(key, { ...rec, __score: score });
        }
    }

    return [...dedup.values()]
        .sort((a, b) => b.__score - a.__score)
        .map(({ __score, ...rec }) => rec)
        .slice(0, 12);
}

async function runAgent(userId, agentName, runInput, sharedContext) {
    const runner = AGENTS[agentName];
    if (!runner) {
        throw new Error(`Unknown agent: ${agentName}`);
    }

    return runner({
        userId,
        goals: runInput.goals || [],
        query: runInput.query || '',
        sharedContext,
    });
}

async function runCoordinatorCycle({ userId, goals = [], query = '' }) {
    queue.clear(userId);

    const startMessage = createAgentMessage({
        from: 'coordinator',
        to: 'coordinator',
        type: MESSAGE_TYPES.TASK,
        priority: 5,
        payload: { status: 'start', at: new Date() },
    });

    await contextService.publishAgentOutput({
        userId,
        agentKey: 'coordinator',
        agentContextPatch: { lastRunInput: { goals, query }, startedAt: new Date() },
        messages: [startMessage],
        statePatch: { status: 'running', lastMessage: 'Coordinator cycle started', error: null },
        interaction: {
            actor: 'coordinator',
            action: 'cycle_started',
            details: { goalsCount: goals.length, hasQuery: Boolean(query) },
            createdAt: new Date(),
        },
    });

    queue.enqueue(
        userId,
        createAgentMessage({ from: 'coordinator', to: 'financialAnalyzer', type: MESSAGE_TYPES.TASK, priority: 5 })
    );
    queue.enqueue(
        userId,
        createAgentMessage({ from: 'coordinator', to: 'goalOptimizer', type: MESSAGE_TYPES.TASK, priority: 4 })
    );
    queue.enqueue(
        userId,
        createAgentMessage({ from: 'coordinator', to: 'alertMonitoring', type: MESSAGE_TYPES.TASK, priority: 5 })
    );
    queue.enqueue(
        userId,
        createAgentMessage({ from: 'coordinator', to: 'insightGeneration', type: MESSAGE_TYPES.TASK, priority: 3 })
    );

    const processed = [];

    while (queue.size(userId) > 0) {
        const msg = queue.dequeue(userId);
        if (!msg) {
            break;
        }

        const agentName = msg.to;
        if (!AGENTS[agentName]) {
            continue;
        }

        const snapshot = await contextService.getContextSnapshot(userId);

        try {
            const output = await runAgent(userId, agentName, { goals, query }, snapshot.sharedContext || {});
            await contextService.publishAgentOutput({
                userId,
                agentKey: agentName,
                ...output,
                interaction: {
                    actor: agentName,
                    action: 'task_completed',
                    details: { messageId: msg.messageId },
                    createdAt: new Date(),
                },
            });

            processed.push({
                agent: agentName,
                messageId: msg.messageId,
                status: 'completed',
            });
        } catch (error) {
            await contextService.publishAgentOutput({
                userId,
                agentKey: agentName,
                agentContextPatch: { lastFailureAt: new Date() },
                messages: [
                    createAgentMessage({
                        from: agentName,
                        to: 'coordinator',
                        type: MESSAGE_TYPES.ESCALATION,
                        priority: 5,
                        payload: { error: error.message },
                    }),
                ],
                statePatch: {
                    status: 'failed',
                    lastMessage: 'Agent task failed',
                    error: error.message,
                },
                interaction: {
                    actor: agentName,
                    action: 'task_failed',
                    details: { messageId: msg.messageId, error: error.message },
                    createdAt: new Date(),
                },
            });

            processed.push({
                agent: agentName,
                messageId: msg.messageId,
                status: 'failed',
                error: error.message,
            });
        }
    }

    const contextSnapshot = await contextService.getContextSnapshot(userId);
    const prioritized = prioritizeRecommendations(contextSnapshot.recommendations || []);

    const finalPatch = {
        prioritizedRecommendations: prioritized,
        completedAt: new Date(),
        processed,
    };

    const doneMessage = createAgentMessage({
        from: 'coordinator',
        to: 'coordinator',
        type: MESSAGE_TYPES.REPORT,
        priority: 4,
        payload: { processedCount: processed.length },
    });

    const finalContext = await contextService.publishAgentOutput({
        userId,
        agentKey: 'coordinator',
        agentContextPatch: finalPatch,
        messages: [doneMessage],
        statePatch: {
            status: 'completed',
            lastMessage: 'Coordinator cycle completed',
            error: null,
        },
        interaction: {
            actor: 'coordinator',
            action: 'cycle_completed',
            details: { processedCount: processed.length },
            createdAt: new Date(),
        },
    });

    return {
        contextVersion: finalContext.contextVersion,
        processed,
        prioritizedRecommendations: prioritized,
        alerts: finalContext.alerts,
        sharedContext: finalContext.sharedContext,
    };
}

module.exports = {
    runCoordinatorCycle,
};
