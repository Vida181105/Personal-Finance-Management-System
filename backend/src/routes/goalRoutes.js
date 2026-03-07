const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

// All routes require authentication
router.use(authMiddleware);

// Get all goals
router.get('/', asyncHandler(goalController.getGoals));

// Get goal statistics
router.get('/stats', asyncHandler(goalController.getGoalStats));

// Get single goal
router.get('/:id', asyncHandler(goalController.getGoalById));

// Create new goal
router.post('/', asyncHandler(goalController.createGoal));

// Update goal
router.put('/:id', asyncHandler(goalController.updateGoal));

// Update goal progress
router.patch('/:id/progress', asyncHandler(goalController.updateProgress));

// Delete goal
router.delete('/:id', asyncHandler(goalController.deleteGoal));

module.exports = router;
