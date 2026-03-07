const express = require('express');
const router = express.Router();
const AgentCoordinatorController = require('../controllers/agentCoordinatorController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(authMiddleware);

// Run full multi-agent orchestration cycle
router.post('/run', asyncHandler(AgentCoordinatorController.runAgents));

// Fetch latest shared context
router.get('/context', asyncHandler(AgentCoordinatorController.getContext));

// Fetch recent inter-agent messages
router.get('/messages', asyncHandler(AgentCoordinatorController.getMessages));

// Fetch per-agent state snapshot
router.get('/state', asyncHandler(AgentCoordinatorController.getState));

module.exports = router;
