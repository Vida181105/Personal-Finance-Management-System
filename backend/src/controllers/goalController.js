const Goal = require('../models/Goal');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get all goals for authenticated user
 */
exports.getGoals = async (req, res) => {
    try {
        const { status, type } = req.query;
        const filter = { userId: req.user.id };

        if (status) filter.status = status;
        if (type) filter.type = type;

        const goals = await Goal.find(filter).sort({ priority: -1, deadline: 1 });

        return successResponse(res, 'Goals retrieved successfully', { goals });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Get single goal by ID
 */
exports.getGoalById = async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return errorResponse(res, 'Goal not found', 404);
        }

        return successResponse(res, 'Goal retrieved successfully', { goal });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Create new goal
 */
exports.createGoal = async (req, res) => {
    try {
        const { name, description, type, targetAmount, currentAmount, deadline, priority } = req.body;

        // Validation
        if (!name || !targetAmount || !deadline) {
            return errorResponse(res, 'Name, target amount, and deadline are required', 400);
        }

        if (targetAmount <= 0) {
            return errorResponse(res, 'Target amount must be positive', 400);
        }

        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            return errorResponse(res, 'Deadline must be in the future', 400);
        }

        const goal = await Goal.create({
            userId: req.user.id,
            name,
            description,
            type: type || 'savings',
            targetAmount,
            currentAmount: currentAmount || 0,
            deadline: deadlineDate,
            priority: priority || 3
        });

        return successResponse(res, 'Goal created successfully', { goal }, 201);
    } catch (error) {

        return errorResponse(res, error.message, 500);
    }
};

/**
 * Update existing goal
 */
exports.updateGoal = async (req, res) => {
    try {
        const { name, description, type, targetAmount, currentAmount, deadline, priority, status } = req.body;

        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return errorResponse(res, 'Goal not found', 404);
        }

        // Update fields
        if (name !== undefined) goal.name = name;
        if (description !== undefined) goal.description = description;
        if (type !== undefined) goal.type = type;
        if (targetAmount !== undefined) {
            if (targetAmount <= 0) {
                return errorResponse(res, 'Target amount must be positive', 400);
            }
            goal.targetAmount = targetAmount;
        }
        if (currentAmount !== undefined) {
            if (currentAmount < 0) {
                return errorResponse(res, 'Current amount cannot be negative', 400);
            }
            goal.currentAmount = currentAmount;
            goal.updateMilestones();
        }
        if (deadline !== undefined) {
            const deadlineDate = new Date(deadline);
            if (deadlineDate <= new Date() && goal.status === 'active') {
                return errorResponse(res, 'Deadline must be in the future for active goals', 400);
            }
            goal.deadline = deadlineDate;
        }
        if (priority !== undefined) goal.priority = priority;
        if (status !== undefined) goal.status = status;

        await goal.save();

        return successResponse(res, 'Goal updated successfully', { goal });
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Update goal progress (add/subtract from current amount)
 */
exports.updateProgress = async (req, res) => {
    try {
        const { amount } = req.body;

        if (amount === undefined || amount === 0) {
            return errorResponse(res, 'Amount is required and must be non-zero', 400);
        }

        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return errorResponse(res, 'Goal not found', 404);
        }

        if (goal.status !== 'active') {
            return errorResponse(res, 'Cannot update progress for inactive goals', 400);
        }

        goal.currentAmount = Math.max(0, goal.currentAmount + amount);
        goal.updateMilestones();
        await goal.save();

        // Check if any new milestones were achieved
        const newlyAchieved = goal.milestones.filter(m =>
            m.achieved &&
            m.achievedDate &&
            (new Date() - new Date(m.achievedDate)) < 5000 // Within last 5 seconds
        );

        return successResponse(res, 'Goal progress updated successfully', {
            goal,
            newMilestones: newlyAchieved.map(m => m.percentage)
        });
    } catch (error) {
        console.error('Update progress error:', error);
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Delete goal
 */
exports.deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return errorResponse(res, 'Goal not found', 404);
        }

        return successResponse(res, 'Goal deleted successfully');
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * Get goal statistics
 */
exports.getGoalStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [active, completed, totalSavings, goals] = await Promise.all([
            Goal.countDocuments({ userId, status: 'active' }),
            Goal.countDocuments({ userId, status: 'completed' }),
            Goal.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'active' } },
                { $group: { _id: null, total: { $sum: '$currentAmount' } } }
            ]),
            Goal.find({ userId, status: 'active' }).sort({ deadline: 1 }).limit(5)
        ]);

        const stats = {
            activeGoals: active,
            completedGoals: completed,
            totalSaved: totalSavings[0]?.total || 0,
            upcomingDeadlines: goals.map(g => ({
                id: g._id,
                name: g.name,
                deadline: g.deadline,
                daysRemaining: g.daysRemaining,
                progress: g.progressPercentage
            }))
        };

        return successResponse(res, 'Goal statistics retrieved successfully', stats);
    } catch (error) {

        return errorResponse(res, error.message, 500);
    }
};
