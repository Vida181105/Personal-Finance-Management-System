const { createAgentMessage, MESSAGE_TYPES } = require('./messageProtocol');

async function callGemini(promptText) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are a personal finance insight engine. Keep advice practical, concise, and actionable.\n\n${promptText}`
                }]
            }],
            generationConfig: {
                maxOutputTokens: 900,
                temperature: 0.3,
            }
        }),
    });

    if (!resp.ok) {
        throw new Error(`Gemini API error: ${resp.status}`);
    }

    const data = await resp.json();
    const firstText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
        narrative = await callGemini(prompt);
        if (narrative) {
            source = 'gemini';
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
