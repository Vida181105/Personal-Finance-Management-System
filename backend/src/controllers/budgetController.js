const Transaction = require('../models/Transaction');
const ResponseHandler = require('../utils/responseHandler');

class BudgetController {
  /**
   * Get Budget Optimization Plan
   * POST /api/budget/optimize
   */
  static async optimizeBudget(req, res, next) {
    try {
      const { userId, monthlyIncome: userMonthlyIncome } = req.user;
      const { savingsGoals = [], minimumExpenseRatio = 0.7 } = req.body;

      if (!userId) {
        return ResponseHandler.validationError(res, 'User ID required');
      }

      // Use the user's stated monthly income from their profile (same value shown in sidebar)
      const totalIncome = userMonthlyIncome || 0;

      // Build average monthly expense categories from the last 3 months of historical data
      const currentDate = new Date();
      const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);

      const recentTransactions = await Transaction.find({
        userId,
        type: 'Expense',
        date: { $gte: threeMonthsAgo },
      }).lean();

      // Sum expenses per category over the 3-month window, then average per month
      const categoryTotals = {};
      recentTransactions.forEach((tx) => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      });

      // Average over 3 months
      const expenseCategories = {};
      Object.entries(categoryTotals).forEach(([cat, total]) => {
        expenseCategories[cat] = Math.round(total / 3);
      });

      // If no recent data, fall back to all-time history
      if (Object.keys(expenseCategories).length === 0) {
        const allTxs = await Transaction.find({ userId, type: 'Expense' }).lean();
        const distinctMonths = new Set(
          allTxs.map((tx) => {
            const d = new Date(tx.date);
            return `${d.getFullYear()}-${d.getMonth()}`;
          })
        ).size || 1;

        allTxs.forEach((tx) => {
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        });
        Object.entries(categoryTotals).forEach(([cat, total]) => {
          expenseCategories[cat] = Math.round(total / distinctMonths);
        });
      }

      // Call ML service to optimize budget
      const optimizationRequest = {
        userId,
        monthly_income: totalIncome,
        expense_categories: expenseCategories,
        savings_goals: savingsGoals,
        minimum_expense_ratio: minimumExpenseRatio,
      };

      const mlResponse = await fetch(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/optimize-budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizationRequest),
      });

      if (!mlResponse.ok) {
        throw new Error('ML service optimization failed');
      }

      const optimizationPlan = await mlResponse.json();

      return ResponseHandler.success(res, 200, 'Budget optimized', optimizationPlan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Spending Summary by Category
   * GET /api/budget/summary/:userId
   */
  static async getSpendingSummary(req, res, next) {
    try {
      const { userId } = req.params;

      if (req.user._id.toString() !== userId && req.user.userId !== userId && req.user.role !== 'admin') {
        return ResponseHandler.forbidden(res, 'Unauthorized');
      }

      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const transactions = await Transaction.find({
        userId,
        type: 'Expense',
        date: { $gte: monthStart, $lte: monthEnd },
      }).lean();

      const categoryTotals = {};
      const categoryTrends = {};

      transactions.forEach((tx) => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      });

      // Get last month for comparison
      const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      const lastMonthTxs = await Transaction.find({
        userId,
        type: 'Expense',
        date: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }).lean();

      const lastMonthTotals = {};
      lastMonthTxs.forEach((tx) => {
        lastMonthTotals[tx.category] = (lastMonthTotals[tx.category] || 0) + tx.amount;
      });

      // Calculate trends
      Object.keys(categoryTotals).forEach((cat) => {
        const current = categoryTotals[cat];
        const last = lastMonthTotals[cat] || current;
        const trend = last > 0 ? ((current - last) / last) * 100 : 0;
        categoryTrends[cat] = {
          current,
          last,
          trend: trend.toFixed(1),
          percentageOfTotal: ((current / Object.values(categoryTotals).reduce((a, b) => a + b, 0)) * 100).toFixed(1),
        };
      });

      const summary = {
        month: currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        totalExpense: Object.values(categoryTotals).reduce((a, b) => a + b, 0),
        categoryBreakdown: categoryTrends,
        transactionCount: transactions.length,
      };

      return ResponseHandler.success(res, 200, 'Spending summary retrieved', summary);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BudgetController;
