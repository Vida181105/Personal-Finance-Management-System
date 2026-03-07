const axios = require('axios');
const Transaction = require('../models/Transaction');
const ResponseHandler = require('../utils/responseHandler');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

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
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/cluster`,
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
        { timeout: 10000 } // 10 second timeout
      );

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
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/anomalies`,
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
        { timeout: 10000 } // 10 second timeout
      );

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
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/forecast`,
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
        { timeout: 10000 } // 10 second timeout
      );

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
