const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const ResponseHandler = require('../utils/responseHandler');

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

        return ResponseHandler.success(res, 200, 'Goals retrieved successfully', { goals });
    } catch (error) {
        return ResponseHandler.error(res, 500, error.message);
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
            return ResponseHandler.error(res, 404, 'Goal not found');
        }

        return ResponseHandler.success(res, 200, 'Goal retrieved successfully', { goal });
    } catch (error) {
        return ResponseHandler.error(res, 500, error.message);
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
            return ResponseHandler.error(res, 400, 'Name, target amount, and deadline are required');
        }

        if (targetAmount <= 0) {
            return ResponseHandler.error(res, 400, 'Target amount must be positive');
        }

        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            return ResponseHandler.error(res, 400, 'Deadline must be in the future');
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

        return ResponseHandler.success(res, 201, 'Goal created successfully', { goal });
    } catch (error) {

        return ResponseHandler.error(res, 500, error.message);
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
            return ResponseHandler.error(res, 404, 'Goal not found');
        }

        // Update fields
        if (name !== undefined) goal.name = name;
        if (description !== undefined) goal.description = description;
        if (type !== undefined) goal.type = type;
        if (targetAmount !== undefined) {
            if (targetAmount <= 0) {
                return ResponseHandler.error(res, 400, 'Target amount must be positive');
            }
            goal.targetAmount = targetAmount;
        }
        if (currentAmount !== undefined) {
            if (currentAmount < 0) {
                return ResponseHandler.error(res, 400, 'Current amount cannot be negative');
            }
            goal.currentAmount = currentAmount;
            goal.updateMilestones();
        }
        if (deadline !== undefined) {
            const deadlineDate = new Date(deadline);
            if (deadlineDate <= new Date() && goal.status === 'active') {
                return ResponseHandler.error(res, 400, 'Deadline must be in the future for active goals');
            }
            goal.deadline = deadlineDate;
        }
        if (priority !== undefined) goal.priority = priority;
        if (status !== undefined) goal.status = status;

        await goal.save();

        return ResponseHandler.success(res, 200, 'Goal updated successfully', { goal });
    } catch (error) {
        return ResponseHandler.error(res, 500, error.message);
    }
};

/**
 * Update goal progress (add/subtract from current amount)
 */
exports.updateProgress = async (req, res) => {
    try {
        const { amount } = req.body;

        if (amount === undefined || amount === 0) {
            return ResponseHandler.error(res, 400, 'Amount is required and must be non-zero');
        }

        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return ResponseHandler.error(res, 404, 'Goal not found');
        }

        if (goal.status !== 'active') {
            return ResponseHandler.error(res, 400, 'Cannot update progress for inactive goals');
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

        return ResponseHandler.success(res, 200, 'Goal progress updated successfully', {
            goal,
            newMilestones: newlyAchieved.map(m => m.percentage)
        });
    } catch (error) {
        console.error('Update progress error:', error);
        return ResponseHandler.error(res, 500, error.message);
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
            return ResponseHandler.error(res, 404, 'Goal not found');
        }

        return ResponseHandler.success(res, 200, 'Goal deleted successfully');
    } catch (error) {
        return ResponseHandler.error(res, 500, error.message);
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

        return ResponseHandler.success(res, 200, 'Goal statistics retrieved successfully', stats);
    } catch (error) {

        return ResponseHandler.error(res, 500, error.message);
    }
};
