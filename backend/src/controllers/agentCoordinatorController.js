const ResponseHandler = require('../utils/responseHandler');
const contextService = require('../services/agents/contextService');
const { runCoordinatorCycle } = require('../services/agents/coordinatorAgent');

class AgentCoordinatorController {
    static async runAgents(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return ResponseHandler.unauthorized(res, 'User authentication required');
            }

            const { goals = [], query = '' } = req.body || {};

            const result = await runCoordinatorCycle({ userId, goals, query });
            return ResponseHandler.success(res, 200, 'Agent cycle completed', result);
        } catch (error) {
            next(error);
        }
    }

    static async getContext(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return ResponseHandler.unauthorized(res, 'User authentication required');
            }

            const snapshot = await contextService.getContextSnapshot(userId);
            return ResponseHandler.success(res, 200, 'Agent context retrieved', snapshot);
        } catch (error) {
            next(error);
        }
    }

    static async getMessages(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return ResponseHandler.unauthorized(res, 'User authentication required');
            }

            const limit = Number(req.query.limit || 30);
            const messages = await contextService.getRecentMessages(userId, limit);
            return ResponseHandler.success(res, 200, 'Agent messages retrieved', messages);
        } catch (error) {
            next(error);
        }
    }

    static async getState(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return ResponseHandler.unauthorized(res, 'User authentication required');
            }

            const snapshot = await contextService.getContextSnapshot(userId);
            return ResponseHandler.success(res, 200, 'Agent state retrieved', {
                contextVersion: snapshot.contextVersion,
                agentStates: snapshot.agentStates,
                updatedAt: snapshot.updatedAt,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AgentCoordinatorController;
