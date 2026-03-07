/**
 * Message Queue with Redis Backend and In-Memory Fallback
 * Provides persistent queue for inter-agent messages
 */

const redisClient = require('../../config/redis');

class MessageQueue {
    constructor() {
        // In-memory fallback when Redis is unavailable
        this.inMemoryQueues = new Map();
        this.useRedis = false;
    }

    /**
     * Initialize queue (connect to Redis if available)
     */
    async init() {
        try {
            await redisClient.connect();
            this.useRedis = redisClient.isReady();
            if (this.useRedis) {
                console.log('✅ MessageQueue using Redis backend');
            } else {
                console.warn('⚠️  MessageQueue using in-memory fallback');
            }
        } catch (error) {
            console.warn('⚠️  MessageQueue using in-memory fallback:', error.message);
            this.useRedis = false;
        }
    }

    /**
     * Get queue key for a user
     */
    _getQueueKey(userId) {
        return `agent:queue:${userId}`;
    }

    /**
     * Enqueue a message (priority-based)
     */
    async enqueue(userId, message) {
        if (this.useRedis && redisClient.isReady()) {
            return await this._enqueueRedis(userId, message);
        } else {
            return this._enqueueMemory(userId, message);
        }
    }

    /**
     * Enqueue using Redis (sorted set by priority and timestamp)
     */
    async _enqueueRedis(userId, message) {
        try {
            const key = this._getQueueKey(userId);
            const client = redisClient.getClient();

            // Score: priority (higher first) + timestamp for FIFO within same priority
            // Use negative priority so higher priority comes first in sorted set
            const score = -message.priority + (Date.now() / 1e13);

            await client.zadd(key, score, JSON.stringify(message));

            // Set expiry to 24 hours to prevent infinite growth
            await client.expire(key, 86400);

            const size = await client.zcard(key);
            return size;
        } catch (error) {
            console.error('Redis enqueue error, falling back to memory:', error.message);
            return this._enqueueMemory(userId, message);
        }
    }

    /**
     * Enqueue using in-memory storage
     */
    _enqueueMemory(userId, message) {
        const queue = this.inMemoryQueues.get(userId) || [];
        queue.push(message);
        queue.sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        this.inMemoryQueues.set(userId, queue);
        return queue.length;
    }

    /**
     * Dequeue next highest-priority message
     */
    async dequeue(userId) {
        if (this.useRedis && redisClient.isReady()) {
            return await this._dequeueRedis(userId);
        } else {
            return this._dequeueMemory(userId);
        }
    }

    /**
     * Dequeue using Redis (ZPOPMIN equivalent)
     */
    async _dequeueRedis(userId) {
        try {
            const key = this._getQueueKey(userId);
            const client = redisClient.getClient();

            // Get highest priority message (lowest score due to negative priority)
            const results = await client.zpopmin(key, 1);

            if (!results || results.length === 0) {
                return null;
            }

            // results format: [member, score]
            const message = JSON.parse(results[0]);
            return message;
        } catch (error) {
            console.error('Redis dequeue error, falling back to memory:', error.message);
            return this._dequeueMemory(userId);
        }
    }

    /**
     * Dequeue using in-memory storage
     */
    _dequeueMemory(userId) {
        const queue = this.inMemoryQueues.get(userId) || [];
        if (queue.length === 0) {
            return null;
        }
        const next = queue.shift();
        this.inMemoryQueues.set(userId, queue);
        return next;
    }

    /**
     * Get queue size
     */
    async size(userId) {
        if (this.useRedis && redisClient.isReady()) {
            try {
                const key = this._getQueueKey(userId);
                const client = redisClient.getClient();
                return await client.zcard(key);
            } catch (error) {
                console.error('Redis size error, falling back to memory:', error.message);
                const queue = this.inMemoryQueues.get(userId) || [];
                return queue.length;
            }
        } else {
            const queue = this.inMemoryQueues.get(userId) || [];
            return queue.length;
        }
    }

    /**
     * Clear queue for a user
     */
    async clear(userId) {
        if (this.useRedis && redisClient.isReady()) {
            try {
                const key = this._getQueueKey(userId);
                const client = redisClient.getClient();
                await client.del(key);
            } catch (error) {
                console.error('Redis clear error:', error.message);
            }
        }
        this.inMemoryQueues.delete(userId);
    }

    /**
     * Peek at next message without removing it
     */
    async peek(userId) {
        if (this.useRedis && redisClient.isReady()) {
            try {
                const key = this._getQueueKey(userId);
                const client = redisClient.getClient();
                const results = await client.zrange(key, 0, 0);
                if (!results || results.length === 0) {
                    return null;
                }
                return JSON.parse(results[0]);
            } catch (error) {
                console.error('Redis peek error:', error.message);
                const queue = this.inMemoryQueues.get(userId) || [];
                return queue.length > 0 ? queue[0] : null;
            }
        } else {
            const queue = this.inMemoryQueues.get(userId) || [];
            return queue.length > 0 ? queue[0] : null;
        }
    }
}

// Singleton instance
const messageQueue = new MessageQueue();

// Initialize on module load
messageQueue.init().catch(err => {
    console.error('Failed to initialize message queue:', err);
});

module.exports = messageQueue;

