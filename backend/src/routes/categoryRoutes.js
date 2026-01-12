const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/categories
 * Get all available categories
 */
router.get('/', asyncHandler(CategoryController.getCategories));

/**
 * POST /api/categories/categorize
 * Auto-categorize a single transaction
 */
router.post('/categorize', asyncHandler(CategoryController.categorizeTransaction));

/**
 * POST /api/categories/categorize-bulk
 * Auto-categorize multiple transactions
 */
router.post('/categorize-bulk', asyncHandler(CategoryController.categorizeBulk));

/**
 * GET /api/categories/:categoryName/rules
 * Get rules for a specific category
 */
router.get('/:categoryName/rules', asyncHandler(CategoryController.getCategoryRules));

/**
 * POST /api/categories/:categoryName/rules
 * Add custom rule (requires auth)
 */
router.post('/:categoryName/rules', authMiddleware, asyncHandler(CategoryController.addCategoryRule));

module.exports = router;
