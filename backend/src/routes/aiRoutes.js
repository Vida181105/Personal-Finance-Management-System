const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

// All AI routes require authentication
router.use(authMiddleware);

/**
 * POST /api/ai/query
 * Handle natural language financial queries
 * Body: { query: "How much did I spend on food last month?" }
 */
router.post('/query', asyncHandler(AIController.handleQuery));

/**
 * POST /api/ai/categorize
 * AI-powered categorization (fallback for rule-based)
 * Body: { description: "Starbucks coffee", amount: 450 }
 */
router.post('/categorize', asyncHandler(AIController.categorizeWithAI));

/**
 * GET /api/ai/insights
 * Get personalized financial insights (cached for 24 hours)
 * Query: ?refresh=true to force regeneration
 */
router.get('/insights', asyncHandler(AIController.getInsights));

module.exports = router;
