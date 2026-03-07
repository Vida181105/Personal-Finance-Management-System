/**
 * Agent Context Service with Redis Caching
 * Manages shared context state across all agents with Redis cache layer
 */

const AgentContext = require('../../models/AgentContext');
const redisClient = require('../../config/redis');

const MAX_MESSAGES = 200;
const MAX_INTERACTIONS = 200;
const MAX_RECOMMENDATIONS = 100;
const MAX_ALERTS = 100;

// Cache TTL in seconds
const CONTEXT_CACHE_TTL = 300; // 5 minutes
const MESSAGES_CACHE_TTL = 180; // 3 minutes

/**
 * Get cache key for context
 */
function getContextCacheKey(userId) {
    return `agent:context:${userId}`;
}

/**
 * Get cache key for messages
 */
function getMessagesCacheKey(userId, limit) {
    return `agent:messages:${userId}:${limit}`;
}

/**
 * Invalidate all cache for a user
 */
async function invalidateUserCache(userId) {
    if (redisClient.isReady()) {
        try {
            await redisClient.delPattern(`agent:context:${userId}*`);
            await redisClient.delPattern(`agent:messages:${userId}*`);
        } catch (error) {
            console.error('Cache invalidation error:', error.message);
        }
    }
}

async function getOrCreateContext(userId) {
    let context = await AgentContext.findOne({ userId });
    if (!context) {
        context = await AgentContext.create({ userId });
    }
    return context;
}

function trimArray(arr, maxItems) {
    if (!Array.isArray(arr)) {
        return [];
    }
    if (arr.length <= maxItems) {
        return arr;
    }
    return arr.slice(arr.length - maxItems);
}

async function updateAgentState(context, agentKey, patch) {
    const previous = context.agentStates?.[agentKey] || {};
    context.agentStates[agentKey] = {
        ...previous,
        ...patch,
    };
}

async function publishAgentOutput({
    userId,
    agentKey,
    agentContextPatch = {},
    messages = [],
    recommendations = [],
    alerts = [],
    statePatch = {},
    interaction = null,
}) {
    const context = await getOrCreateContext(userId);

    context.sharedContext = {
        ...(context.sharedContext || {}),
        [agentKey]: {
            ...(context.sharedContext?.[agentKey] || {}),
            ...agentContextPatch,
            updatedAt: new Date(),
        },
    };

    await updateAgentState(context, agentKey, {
        ...statePatch,
        lastRun: new Date(),
    });

    if (messages.length > 0) {
        const enrichedMessages = messages.map((msg) => ({
            ...msg,
            status: msg.status || 'processed',
            processedAt: msg.processedAt || new Date(),
        }));
        context.messages = trimArray([...(context.messages || []), ...enrichedMessages], MAX_MESSAGES);
    }

    if (recommendations.length > 0) {
        context.recommendations = trimArray(
            [...(context.recommendations || []), ...recommendations],
            MAX_RECOMMENDATIONS
        );
    }

    if (alerts.length > 0) {
        context.alerts = trimArray([...(context.alerts || []), ...alerts], MAX_ALERTS);
    }

    if (interaction) {
        context.interactions = trimArray([...(context.interactions || []), interaction], MAX_INTERACTIONS);
    }

    context.contextVersion += 1;
    await context.save();

    // Invalidate cache after update
    await invalidateUserCache(userId);

    return context;
}

async function getContextSnapshot(userId) {
    // Try cache first
    const cacheKey = getContextCacheKey(userId);

    if (redisClient.isReady()) {
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return cached;
            }
        } catch (error) {
            console.error('Cache read error:', error.message);
        }
    }

    // Fetch from DB
    const context = await getOrCreateContext(userId);
    const snapshot = {
        userId: context.userId,
        contextVersion: context.contextVersion,
        sharedContext: context.sharedContext,
        agentStates: context.agentStates,
        recommendations: context.recommendations,
        alerts: context.alerts,
        updatedAt: context.updatedAt,
    };

    // Cache for future requests
    if (redisClient.isReady()) {
        try {
            await redisClient.set(cacheKey, snapshot, CONTEXT_CACHE_TTL);
        } catch (error) {
            console.error('Cache write error:', error.message);
        }
    }

    return snapshot;
}

async function getRecentMessages(userId, limit = 30) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 30));

    // Try cache first
    const cacheKey = getMessagesCacheKey(userId, safeLimit);

    if (redisClient.isReady()) {
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return cached;
            }
        } catch (error) {
            console.error('Cache read error:', error.message);
        }
    }

    // Fetch from DB
    const context = await getOrCreateContext(userId);
    const messages = context.messages || [];
    const result = messages.slice(messages.length - safeLimit);

    // Cache for future requests
    if (redisClient.isReady()) {
        try {
            await redisClient.set(cacheKey, result, MESSAGES_CACHE_TTL);
        } catch (error) {
            console.error('Cache write error:', error.message);
        }
    }

    return result;
}

module.exports = {
    getOrCreateContext,
    publishAgentOutput,
    getContextSnapshot,
    getRecentMessages,
    invalidateUserCache,
};

