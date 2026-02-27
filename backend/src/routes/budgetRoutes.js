const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const BudgetController = require('../controllers/budgetController');

const router = express.Router();

// All budget routes require authentication
router.use(authMiddleware);

/**
 * Budget optimization and analysis routes
 */

// POST /api/budget/optimize - Optimize budget allocation based on goals
router.post('/optimize', asyncHandler(BudgetController.optimizeBudget));

// GET /api/budget/summary/:userId - Get spending summary by category
router.get('/summary/:userId', asyncHandler(BudgetController.getSpendingSummary));

module.exports = router;
