const Transaction = require('../models/Transaction');
const User = require('../models/User');

class AnalyticsService {
  /**
   * Get monthly spending summary for a user
   * Returns: Total income, total expenses, and net for each month
   */
  static async getMonthlySpending(userId, year) {
    try {
      const result = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            date: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            income: {
              $sum: {
                $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0],
              },
            },
            expenses: {
              $sum: {
                $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $addFields: {
            net: { $subtract: ['$income', '$expenses'] },
          },
        },
        {
          $sort: { '_id.month': 1 },
        },
        {
          $project: {
            _id: 0,
            month: '$_id.month',
            year: '$_id.year',
            income: 1,
            expenses: 1,
            net: 1,
            transactionCount: '$count',
          },
        },
      ], { maxTimeMS: 60000 });

      return result;
    } catch (error) {
      throw new Error(`Error fetching monthly spending: ${error.message}`);
    }
  }

  /**
   * Get category-wise expense breakdown for a user
   * Returns: Total and percentage of spending per category
   */
  static async getCategoryWiseExpenses(userId, startDate, endDate) {
    try {
      // First, get total expenses
      const totalExpenses = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            type: 'Expense',
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ], { maxTimeMS: 60000 });

      const grandTotal = totalExpenses[0]?.total || 0;

      // Then, get category breakdown
      const categoryBreakdown = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            type: 'Expense',
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $addFields: {
            percentage: {
              $cond: [
                { $eq: [grandTotal, 0] },
                0,
                { $multiply: [{ $divide: ['$totalAmount', grandTotal] }, 100] },
              ],
            },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            totalAmount: { $round: ['$totalAmount', 2] },
            percentage: { $round: ['$percentage', 2] },
            transactionCount: '$count',
          },
        },
      ], { maxTimeMS: 60000 });

      return {
        grandTotal: Math.round(grandTotal * 100) / 100,
        categories: categoryBreakdown,
      };
    } catch (error) {
      throw new Error(`Error fetching category breakdown: ${error.message}`);
    }
  }

  /**
   * Get income vs expense summary for a user
   * Returns: Total income, total expenses, savings rate, and trend
   */
  static async getIncomeVsExpenseSummary(userId, startDate, endDate) {
    try {
      const summary = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            average: { $avg: '$amount' },
          },
        },
        {
          $project: {
            _id: 0,
            type: '$_id',
            total: { $round: ['$total', 2] },
            count: 1,
            average: { $round: ['$average', 2] },
          },
        },
      ], { maxTimeMS: 60000 });

      // Transform results
      let income = 0,
        expenses = 0;
      const details = {};

      summary.forEach((item) => {
        if (item.type === 'Income') {
          income = item.total;
          details.income = item;
        } else {
          expenses = item.total;
          details.expenses = item;
        }
      });

      const savingsAmount = income - expenses;
      const savingsRate =
        income > 0 ? Math.round((savingsAmount / income) * 100 * 100) / 100 : 0;

      return {
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        savings: Math.round(savingsAmount * 100) / 100,
        savingsRate: savingsRate,
        details: details,
      };
    } catch (error) {
      throw new Error(
        `Error fetching income vs expense summary: ${error.message}`
      );
    }
  }

  /**
   * Get top merchants by spending
   * Returns: Most frequently used merchants and total spent
   */
  static async getTopMerchants(userId, limit = 10, startDate = null, endDate = null) {
    try {
      const match = {
        userId: userId,
        type: 'Expense',
        merchantName: { $ne: null, $ne: 'Unknown' },
      };

      if (startDate && endDate) {
        match.date = { $gte: startDate, $lte: endDate };
      }

      const result = await Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$merchantName',
            totalSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            averageTransaction: { $avg: '$amount' },
          },
        },
        {
          $sort: { totalSpent: -1 },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _id: 0,
            merchant: '$_id',
            totalSpent: { $round: ['$totalSpent', 2] },
            transactionCount: 1,
            averageTransaction: { $round: ['$averageTransaction', 2] },
          },
        },
      ], { maxTimeMS: 60000 });

      return result;
    } catch (error) {
      throw new Error(`Error fetching top merchants: ${error.message}`);
    }
  }

  /**
   * Get spending trend (daily/weekly/monthly averages)
   * Helps identify spending patterns
   */
  static async getSpendingTrend(userId, startDate, endDate, groupBy = 'daily') {
    try {
      let groupStage;

      if (groupBy === 'weekly') {
        groupStage = {
          $group: {
            _id: {
              year: { $year: '$date' },
              week: { $week: '$date' },
            },
            totalSpending: {
              $sum: {
                $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0],
              },
            },
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0],
              },
            },
            transactionCount: { $sum: 1 },
          },
        };
      } else if (groupBy === 'monthly') {
        groupStage = {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            totalSpending: {
              $sum: {
                $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0],
              },
            },
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0],
              },
            },
            transactionCount: { $sum: 1 },
          },
        };
      } else {
        // daily
        groupStage = {
          $group: {
            _id: {
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$date' },
              },
            },
            totalSpending: {
              $sum: {
                $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0],
              },
            },
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0],
              },
            },
            transactionCount: { $sum: 1 },
          },
        };
      }

      const result = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        groupStage,
        {
          $sort: { '_id': 1 },
        },
        {
          $project: {
            _id: 0,
            period: '$_id',
            spending: { $round: ['$totalSpending', 2] },
            income: { $round: ['$totalIncome', 2] },
            netFlow: {
              $round: [
                { $subtract: ['$totalIncome', '$totalSpending'] },
                2,
              ],
            },
            transactionCount: 1,
          },
        },
      ], { maxTimeMS: 60000 });

      return result;
    } catch (error) {
      throw new Error(`Error fetching spending trend: ${error.message}`);
    }
  }
}

module.exports = AnalyticsService;
