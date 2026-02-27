const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['Income', 'Expense'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    merchantName: {
      type: String,
    },
    description: {
      type: String,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Net Banking', 'UPI'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
    },
    anomaly_score: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    is_anomaly: {
      type: Boolean,
      default: false,
    },
    anomaly_reason: {
      type: String,
    },
    suggested_category: {
      type: String,
    },
    category_confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Index for common financial queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
