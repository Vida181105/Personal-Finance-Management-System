const express = require('express');
const router = express.Router();
const MLController = require('../controllers/mlController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * ML Service Routes
 * All routes require authentication
 */

// Health check
router.get('/health', asyncHandler(MLController.healthCheck));

// Clustering analysis
router.post('/cluster', authMiddleware, asyncHandler(MLController.getSpendingClusters));

// Anomaly detection
router.post('/anomalies', authMiddleware, asyncHandler(MLController.detectAnomalies));

// Forecasting
router.post('/forecast', authMiddleware, asyncHandler(MLController.forecastExpenses));

module.exports = router;
