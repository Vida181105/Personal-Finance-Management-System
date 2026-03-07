const axios = require('axios');
const Transaction = require('../models/Transaction');
const ResponseHandler = require('../utils/responseHandler');
const redisClient = require('../config/redis');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_CACHE_TTL_SECONDS = Number(process.env.ML_CACHE_TTL_SECONDS || 180);
const localMlCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildCacheKey(userId, type, params = {}) {
  return `ml:${type}:${userId}:${JSON.stringify(params)}`;
}

async function getCachedMlResult(cacheKey) {
  if (redisClient.isReady()) {
    try {
      return await redisClient.get(cacheKey);
    } catch (error) {
      console.error('ML cache read error:', error.message);
    }
  }

  const item = localMlCache.get(cacheKey);
  if (!item) {
    return null;
  }
  if (Date.now() > item.expiresAt) {
    localMlCache.delete(cacheKey);
    return null;
  }
  return item.data;
}

async function setCachedMlResult(cacheKey, data, ttlSeconds = ML_CACHE_TTL_SECONDS) {
  if (redisClient.isReady()) {
    try {
      await redisClient.set(cacheKey, data, ttlSeconds);
      return;
    } catch (error) {
      console.error('ML cache write error:', error.message);
    }
  }

  localMlCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

async function postToMlWithRetry(path, payload, timeout = 10000, maxRetries = 1) {
  let attempt = 0;

  while (true) {
    try {
      return await axios.post(`${ML_SERVICE_URL}${path}`, payload, { timeout });
    } catch (error) {
      const status = error?.response?.status;
      if (status !== 429 || attempt >= maxRetries) {
        throw error;
      }

      const retryAfterHeader = error?.response?.headers?.['retry-after'];
      const retryAfterSeconds = Number(retryAfterHeader);
      const waitMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 1500 * (attempt + 1);

      attempt += 1;
      await sleep(waitMs);
    }
  }
}

function handleMlServiceError(error, res, next) {
  const status = error?.response?.status;

  if (status === 429) {
    return ResponseHandler.error(
      res,
      429,
      'ML analytics is rate-limited right now. Please wait about a minute and try again.',
      null,
      'ML_RATE_LIMIT'
    );
  }

  if (error.code === 'ECONNABORTED') {
    return ResponseHandler.error(
      res,
      504,
      'ML analytics request timed out. Please try again.',
      null,
      'ML_TIMEOUT'
    );
  }

  if (error.code === 'ECONNREFUSED' || status === 502 || status === 503 || status === 504) {
    return ResponseHandler.error(
      res,
      503,
      'ML service temporarily unavailable. Please try again later.',
      null,
      'ML_SERVICE_UNAVAILABLE'
    );
  }

  return next(error);
}

/**
 * ML Service Integration Controller
 * Bridges backend routes to Python ML microservice
 */
class MLController {
  /**
   * POST /api/ml/cluster
   * Get spending pattern clusters using KMeans
   */
  static async getSpendingClusters(req, res, next) {
    try {
      const { userId } = req.user;
      const { n_clusters = 5 } = req.body;
      const cacheKey = buildCacheKey(userId, 'cluster', { n_clusters });

      const cached = await getCachedMlResult(cacheKey);
      if (cached) {
        return ResponseHandler.success(res, 200, 'Clustering analysis complete (cached)', cached);
      }

      // Fetch all available transactions for better clustering (up to 300)
      const transactions = await Transaction.find({ userId })
        .select('date amount type category merchantName')
        .sort({ date: -1 })
        .limit(300)
        .lean();

      if (transactions.length < 3) {
        return ResponseHandler.success(res, 200, 'Insufficient transactions for clustering', {
          message: 'Need at least 3 transactions. Start by uploading transaction data.',
        });
      }

      // Call ML service
      const mlResponse = await postToMlWithRetry(
        '/cluster',
        {
          userId,
          transactions: transactions.map((t) => ({
            date: t.date.toISOString(),
            amount: t.amount,
            type: t.type,
            category: t.category,
            merchantName: t.merchantName,
          })),
          n_clusters,
        },
        10000,
        1
      );

      await setCachedMlResult(cacheKey, mlResponse.data);

      return ResponseHandler.success(res, 200, 'Clustering analysis complete', mlResponse.data);
    } catch (error) {
      return handleMlServiceError(error, res, next);
    }
  }

  /**
   * POST /api/ml/anomalies
   * Detect unusual transactions using Isolation Forest
   */
  static async detectAnomalies(req, res, next) {
    try {
      const { userId } = req.user;
      const { contamination = 0.1 } = req.body;
      const cacheKey = buildCacheKey(userId, 'anomalies', { contamination });

      const cached = await getCachedMlResult(cacheKey);
      if (cached) {
        return ResponseHandler.success(res, 200, 'Anomaly detection complete (cached)', cached);
      }

      // Fetch all available transactions for better anomaly detection (up to 200)
      const transactions = await Transaction.find({ userId })
        .select('date amount type category merchantName')
        .sort({ date: -1 })
        .limit(200)
        .lean();

      if (transactions.length < 5) {
        return ResponseHandler.success(res, 200, 'Insufficient transactions for anomaly detection', {
          message: 'Need at least 5 transactions for analysis.',
        });
      }

      // Call ML service
      const mlResponse = await postToMlWithRetry(
        '/anomalies',
        {
          userId,
          transactions: transactions.map((t) => ({
            date: t.date.toISOString(),
            amount: t.amount,
            type: t.type,
            category: t.category,
            merchantName: t.merchantName,
          })),
          contamination,
        },
        10000,
        1
      );

      await setCachedMlResult(cacheKey, mlResponse.data);

      return ResponseHandler.success(res, 200, 'Anomaly detection complete', mlResponse.data);
    } catch (error) {
      return handleMlServiceError(error, res, next);
    }
  }

  /**
   * POST /api/ml/forecast
   * Forecast spending patterns using time series
   */
  static async forecastExpenses(req, res, next) {
    try {
      const { userId } = req.user;
      const { forecast_days = 30 } = req.body;
      const cacheKey = buildCacheKey(userId, 'forecast', { forecast_days });

      const cached = await getCachedMlResult(cacheKey);
      if (cached) {
        return ResponseHandler.success(res, 200, 'Expense forecast generated (cached)', cached);
      }

      // Fetch user transactions
      const transactions = await Transaction.find({ userId })
        .select('date amount type category merchantName')
        .sort({ date: -1 })
        .limit(365) // Last year
        .lean();

      if (transactions.length < 10) {
        return ResponseHandler.success(res, 200, 'Insufficient transactions for forecasting', {
          message: 'Need at least 10 transactions for accurate forecasting.',
        });
      }

      // Call ML service
      const mlResponse = await postToMlWithRetry(
        '/forecast',
        {
          userId,
          transactions: transactions
            .reverse()
            .map((t) => ({
              date: t.date.toISOString(),
              amount: t.amount,
              type: t.type,
              category: t.category,
              merchantName: t.merchantName,
            })),
          forecast_days,
        },
        10000,
        1
      );

      await setCachedMlResult(cacheKey, mlResponse.data);

      return ResponseHandler.success(res, 200, 'Expense forecast generated', mlResponse.data);
    } catch (error) {
      return handleMlServiceError(error, res, next);
    }
  }

  /**
   * GET /api/ml/health
   * Check ML service health
   */
  static async healthCheck(req, res, next) {
    try {
      const mlHealth = await axios.get(`${ML_SERVICE_URL}/health`);
      return ResponseHandler.success(res, 200, 'ML service is healthy', mlHealth.data);
    } catch (error) {
      return ResponseHandler.error(res, 503, 'ML service is unavailable', null, 'ML_SERVICE_DOWN');
    }
  }
}

module.exports = MLController;
