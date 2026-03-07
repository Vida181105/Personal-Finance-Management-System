const mongoose = require('mongoose');

const agentStateSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ['idle', 'running', 'completed', 'failed'],
            default: 'idle',
        },
        lastRun: Date,
        lastMessage: String,
        error: String,
    },
    { _id: false }
);

const agentMessageSchema = new mongoose.Schema(
    {
        messageId: { type: String, required: true },
        from: { type: String, required: true },
        to: { type: String, required: true },
        type: { type: String, required: true },
        priority: { type: Number, default: 2 },
        payload: { type: mongoose.Schema.Types.Mixed, default: {} },
        status: {
            type: String,
            enum: ['queued', 'processed', 'failed'],
            default: 'queued',
        },
        createdAt: { type: Date, default: Date.now },
        processedAt: Date,
    },
    { _id: false }
);

const recommendationSchema = new mongoose.Schema(
    {
        sourceAgent: { type: String, required: true },
        title: { type: String, required: true },
        detail: { type: String, required: true },
        priority: { type: Number, min: 1, max: 5, default: 3 },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        tags: { type: [String], default: [] },
        createdAt: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false },
    },
    { _id: false }
);

const alertSchema = new mongoose.Schema(
    {
        sourceAgent: { type: String, required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        category: String,
        escalated: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const interactionSchema = new mongoose.Schema(
    {
        actor: { type: String, required: true },
        action: { type: String, required: true },
        details: { type: mongoose.Schema.Types.Mixed, default: {} },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const agentContextSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        contextVersion: { type: Number, default: 1 },
        sharedContext: { type: mongoose.Schema.Types.Mixed, default: {} },
        agentStates: {
            financialAnalyzer: { type: agentStateSchema, default: () => ({}) },
            goalOptimizer: { type: agentStateSchema, default: () => ({}) },
            alertMonitoring: { type: agentStateSchema, default: () => ({}) },
            insightGeneration: { type: agentStateSchema, default: () => ({}) },
            coordinator: { type: agentStateSchema, default: () => ({}) },
        },
        messages: { type: [agentMessageSchema], default: [] },
        recommendations: { type: [recommendationSchema], default: [] },
        alerts: { type: [alertSchema], default: [] },
        interactions: { type: [interactionSchema], default: [] },
    },
    {
        timestamps: true,
    }
);

agentContextSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('AgentContext', agentContextSchema);
