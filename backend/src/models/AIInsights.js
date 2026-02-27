const mongoose = require('mongoose');

const aiInsightsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    insights: [
      {
        type: {
          type: String,
          enum: ['warning', 'tip', 'pattern', 'opportunity'],
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
        actionable: {
          type: Boolean,
          default: false,
        },
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  },
  {
    timestamps: true,
  }
);

// Create TTL index for automatic document deletion after 24 hours
aiInsightsSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AIInsights', aiInsightsSchema);
