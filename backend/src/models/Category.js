const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    categoryType: {
      type: String,
      enum: ['Income', 'Expense'],
      required: true,
    },
    description: {
      type: String,
    },
    budgetLimit: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', categorySchema);
