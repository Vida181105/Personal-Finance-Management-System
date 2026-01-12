const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

// All transaction routes require authentication
router.use(authMiddleware);

/**
 * POST /api/transactions/:userId/bulk
 * Bulk create transactions
 */
router.post('/:userId/bulk', asyncHandler(TransactionController.bulkCreateTransactions));

/**
 * GET /api/transactions/:userId/stats
 * Get transaction statistics
 */
router.get('/:userId/stats', asyncHandler(TransactionController.getTransactionStats));

/**
 * GET /api/transactions/:userId
 * Get all transactions for a user with filtering and pagination
 */
router.get('/:userId', asyncHandler(TransactionController.getTransactions));

/**
 * GET /api/transactions/:userId/:transactionId
 * Get single transaction
 */
router.get('/:userId/:transactionId', asyncHandler(TransactionController.getTransaction));

/**
 * POST /api/transactions/:userId
 * Create new transaction
 */
router.post('/:userId', asyncHandler(TransactionController.createTransaction));

/**
 * PUT /api/transactions/:userId/:transactionId
 * Update transaction
 */
router.put('/:userId/:transactionId', asyncHandler(TransactionController.updateTransaction));

/**
 * DELETE /api/transactions/:userId/:transactionId
 * Delete transaction
 */
router.delete('/:userId/:transactionId', asyncHandler(TransactionController.deleteTransaction));

module.exports = router;
