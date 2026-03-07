const { createAgentMessage, MESSAGE_TYPES } = require('./messageProtocol');

async function callClaude(promptText) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return null;
    }

    const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: 900,
            messages: [{ role: 'user', content: promptText }],
        }),
    });

    if (!resp.ok) {
        throw new Error(`Claude API error: ${resp.status}`);
    }

    const data = await resp.json();
    const firstText = data?.content?.find((item) => item.type === 'text')?.text;
    return firstText || null;
}

function fallbackNarrative({ financial, goals, monitoring, query }) {
    const topCat = financial?.summary?.topCategories?.[0]?.category || 'your top category';
    const anomalyCount = monitoring?.anomalyCount || 0;
    const dueBills = monitoring?.dueBills?.length || 0;

    return [
        `You are spending most in ${topCat}.`,
        anomalyCount > 0
            ? `Detected ${anomalyCount} unusual transactions; review high-value entries first.`
            : 'No significant anomaly spikes were detected in the latest cycle.',
        dueBills > 0
            ? `${dueBills} bill(s) are approaching due dates; prioritize critical ones.`
            : 'No urgent recurring bills were detected in the next two weeks.',
        goals?.optimizationPlan
            ? 'Use the goal optimization plan to set category caps and weekly checkpoints.'
            : 'Set clear savings goals so the optimizer can generate stronger plans.',
        query ? `Answering your query: ${query}` : null,
    ]
        .filter(Boolean)
        .join(' ');
}

async function runInsightGenerationAgent({ userId, query, sharedContext }) {
    const financial = sharedContext?.financialAnalyzer || {};
    const goals = sharedContext?.goalOptimizer || {};
    const monitoring = sharedContext?.alertMonitoring || {};

    const prompt = [
        'You are a personal finance insight engine.',
        'Synthesize concise, practical recommendations from the following multi-agent context.',
        `Financial summary: ${JSON.stringify(financial.summary || {}, null, 2)}`,
        `Trends: ${JSON.stringify(financial.trends || {}, null, 2)}`,
        `Goal optimization: ${JSON.stringify(goals.optimizationPlan || {}, null, 2)}`,
        `Alerts: ${JSON.stringify({ anomalyCount: monitoring.anomalyCount, dueBills: monitoring.dueBills || [] }, null, 2)}`,
        query ? `User query: ${query}` : '',
        'Output plain text with: monthly summary, 3 prioritized actions, 1 caution, 1 encouragement.',
    ]
        .filter(Boolean)
        .join('\n\n');

    let narrative = null;
    let source = 'fallback';
    try {
        narrative = await callClaude(prompt);
        if (narrative) {
            source = 'claude';
        }
    } catch (error) {
        narrative = null;
    }

    if (!narrative) {
        narrative = fallbackNarrative({ financial, goals, monitoring, query });
    }

    return {
        agentContextPatch: {
            monthlyReport: {
                source,
                narrative,
                generatedAt: new Date(),
            },
            lastQueryResponse: query
                ? {
                    query,
                    answer: narrative,
                    generatedAt: new Date(),
                }
                : null,
        },
        recommendations: [
            {
                sourceAgent: 'insightGeneration',
                title: 'Review monthly AI report',
                detail: 'Use the synthesized report to pick your top 3 actions this month.',
                priority: 3,
                severity: 'low',
                tags: ['insights', 'planning'],
                createdAt: new Date(),
                resolved: false,
            },
        ],
        alerts: [],
        messages: [
            createAgentMessage({
                from: 'insightGeneration',
                to: 'coordinator',
                type: MESSAGE_TYPES.REPORT,
                priority: 3,
                payload: { source, hasQuery: Boolean(query) },
            }),
        ],
        statePatch: {
            status: 'completed',
            lastMessage: `Insight generation complete (${source})`,
            error: null,
        },
    };
}

module.exports = {
    runInsightGenerationAgent,
};
