const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    percentage: {
        type: Number,
        required: true,
        enum: [25, 50, 75, 100]
    },
    targetAmount: {
        type: Number,
        required: true
    },
    achieved: {
        type: Boolean,
        default: false
    },
    achievedDate: Date
});

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['savings', 'debt_payoff', 'investment'],
        default: 'savings'
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    deadline: {
        type: Date,
        required: true
    },
    priority: {
        type: Number,
        default: 3,
        min: 1,
        max: 5
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'cancelled'],
        default: 'active'
    },
    milestones: [milestoneSchema],
    completedAt: Date
}, {
    timestamps: true
});

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function () {
    if (this.targetAmount === 0) return 0;
    return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function () {
    const now = new Date();
    const deadline = new Date(this.deadline);
    const diff = deadline - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for monthly target
goalSchema.virtual('monthlyTarget').get(function () {
    const daysRemaining = this.daysRemaining;
    if (daysRemaining <= 0) return 0;
    const monthsRemaining = Math.max(1, daysRemaining / 30);
    const amountRemaining = this.targetAmount - this.currentAmount;
    return Math.max(0, amountRemaining / monthsRemaining);
});

// Ensure virtuals are included in JSON
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

// Auto-generate milestones on creation
goalSchema.pre('save', function (next) {
    if (this.isNew && this.milestones.length === 0) {
        this.milestones = [
            { percentage: 25, targetAmount: this.targetAmount * 0.25, achieved: false },
            { percentage: 50, targetAmount: this.targetAmount * 0.50, achieved: false },
            { percentage: 75, targetAmount: this.targetAmount * 0.75, achieved: false },
            { percentage: 100, targetAmount: this.targetAmount, achieved: false }
        ];
    }
    next();
});

// Update milestone achievements based on current amount
goalSchema.methods.updateMilestones = function () {
    this.milestones.forEach(milestone => {
        if (!milestone.achieved && this.currentAmount >= milestone.targetAmount) {
            milestone.achieved = true;
            milestone.achievedDate = new Date();
        }
    });

    // Mark as completed if 100% milestone achieved
    const finalMilestone = this.milestones.find(m => m.percentage === 100);
    if (finalMilestone && finalMilestone.achieved && this.status === 'active') {
        this.status = 'completed';
        this.completedAt = new Date();
    }
};

// Index for efficient queries
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, deadline: 1 });

module.exports = mongoose.model('Goal', goalSchema);
