/**
 * Redis Client Configuration
 * Provides Redis connection for caching and message queue
 */

const Redis = require('ioredis');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        if (this.isConnected) {
            return this.client;
        }

        try {
            const redisConfig = {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
                db: parseInt(process.env.REDIS_DB || '0', 10),
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: false
            };

            this.client = new Redis(redisConfig);

            this.client.on('connect', () => {
                console.log('✅ Redis connected');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                console.error('❌ Redis connection error:', err.message);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                console.log('🔌 Redis connection closed');
                this.isConnected = false;
            });

            // Wait for connection to be ready
            await this.client.ping();
            this.isConnected = true;

            return this.client;
        } catch (error) {
            console.error('❌ Failed to connect to Redis:', error.message);
            console.warn('⚠️  Running without Redis - caching and queue will use fallback');
            this.isConnected = false;
            return null;
        }
    }

    /**
     * Get Redis client instance
     */
    getClient() {
        return this.client;
    }

    /**
     * Check if Redis is connected
     */
    isReady() {
        return this.isConnected && this.client && this.client.status === 'ready';
    }

    /**
     * Set a key with optional TTL
     */
    async set(key, value, ttlSeconds = null) {
        if (!this.isReady()) {
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, serialized);
            } else {
                await this.client.set(key, serialized);
            }
            return true;
        } catch (error) {
            console.error(`Redis SET error for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Get a key's value
     */
    async get(key) {
        if (!this.isReady()) {
            return null;
        }

        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Redis GET error for key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Delete a key
     */
    async del(key) {
        if (!this.isReady()) {
            return false;
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error(`Redis DEL error for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Delete keys matching a pattern
     */
    async delPattern(pattern) {
        if (!this.isReady()) {
            return 0;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
                return keys.length;
            }
            return 0;
        } catch (error) {
            console.error(`Redis DEL pattern error for ${pattern}:`, error.message);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key) {
        if (!this.isReady()) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Redis EXISTS error for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Increment a counter
     */
    async incr(key) {
        if (!this.isReady()) {
            return null;
        }

        try {
            return await this.client.incr(key);
        } catch (error) {
            console.error(`Redis INCR error for key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Set expiry on a key
     */
    async expire(key, ttlSeconds) {
        if (!this.isReady()) {
            return false;
        }

        try {
            await this.client.expire(key, ttlSeconds);
            return true;
        } catch (error) {
            console.error(`Redis EXPIRE error for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
