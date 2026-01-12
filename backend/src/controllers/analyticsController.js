/**
 * Analytics Controller
 * Handles all analytics API requests
 * Separates concerns: validation → service call → response formatting
 * 
 * Architecture:
 * Route Handler → Controller → Service → Database
 *                    ↓
 *            (validation, formatting)
 */

const ResponseHandler = require('../utils/responseHandler');
const ValidationUtils = require('../utils/validation');
const AnalyticsService = require('../services/analyticsService');
const { asyncHandler } = require('../middleware/errorHandler');

class AnalyticsController {
  /**
   * Get monthly spending summary for a user
   * 
   * Request:
   *   GET /api/analytics/monthly-spending/{userId}?year=2024
   * 
   * Response on success:
   *   {
   *     success: true,
   *     message: "Monthly spending data retrieved successfully",
   *     data: [
   *       { month: 1, income: 50000, expenses: 25000, net: 25000, transactionCount: 45 },
   *       ...
   *     ],
   *     meta: { year: 2024 }
   *   }
   * 
   * Validation:
   *   - userId: Required, format U001-U999
   *   - year: Optional, defaults to current year, range 2000-2099
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getMonthlySpending = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { year } = req.query;

    // Validate userId
    const userIdValidation = ValidationUtils.validateUserId(userId);
    if (!userIdValidation.isValid) {
      return ResponseHandler.validationError(res, 'Invalid userId', [
        userIdValidation.error,
      ]);
    }

    // Validate year
    const yearValidation = ValidationUtils.validateYear(year);
    if (!yearValidation.isValid) {
      return ResponseHandler.validationError(res, 'Invalid year', [
        yearValidation.error,
      ]);
    }

    // Fetch analytics data from service
    const result = await AnalyticsService.getMonthlySpending(
      userId,
      yearValidation.year
    );

    // Check for empty results
    if (!result || result.length === 0) {
      return ResponseHandler.success(
        res,
        200,
        'No transactions found for the specified period',
        [],
        { year: yearValidation.year, count: 0 }
      );
    }

    // Return successful response
    return ResponseHandler.success(
      res,
      200,
      'Monthly spending data retrieved successfully',
      result,
      {
        year: yearValidation.year,
        months: result.length,
        totalIncome: result.reduce((sum, m) => sum + m.income, 0),
        totalExpenses: result.reduce((sum, m) => sum + m.expenses, 0),
      }
    );
  });

  /**
   * Get category-wise expense breakdown
   * 
   * Request:
   *   GET /api/analytics/category-breakdown/{userId}?startDate=2024-01-01&endDate=2024-01-31
   * 
   * Response on success:
   *   {
   *     success: true,
   *     message: "Category breakdown retrieved successfully",
   *     data: {
   *       grandTotal: 45000,
   *       categories: [
   *         { category: "Rent", totalAmount: 20000, percentage: 44.44, transactionCount: 1 },
   *         ...
   *       ]
   *     },
   *     meta: { period: { startDate: "2024-01-01", endDate: "2024-01-31" }, count: 5 }
   *   }
   * 
   * Validation:
   *   - userId: Required, format U001-U999
   *   - startDate: Required, ISO format (YYYY-MM-DD)
   *   - endDate: Required, ISO format (YYYY-MM-DD)
   *   - startDate must be <= endDate
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getCategoryBreakdown = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate all parameters
    const validation = ValidationUtils.validateAnalyticsParams(
      { userId, startDate, endDate },
      'category'
    );

    if (!validation.isValid) {
      return ResponseHandler.validationError(
        res,
        'Validation failed',
        validation.errors
      );
    }

    const { startDate: start, endDate: end } = validation.data;

    // Fetch analytics data from service
    const result = await AnalyticsService.getCategoryWiseExpenses(
      userId,
      start,
      end
    );

    // Check for empty results
    if (!result || result.grandTotal === 0) {
      return ResponseHandler.success(
        res,
        200,
        'No expenses found for the specified period',
        { grandTotal: 0, categories: [] },
        {
          period: { startDate: startDate, endDate: endDate },
          count: 0,
        }
      );
    }

    // Return successful response
    return ResponseHandler.success(
      res,
      200,
      'Category breakdown retrieved successfully',
      result,
      {
        period: { startDate: startDate, endDate: endDate },
        count: result.categories.length,
        grandTotal: result.grandTotal,
      }
    );
  });

  /**
   * Get income vs expense summary
   * 
   * Request:
   *   GET /api/analytics/income-vs-expense/{userId}?startDate=2024-01-01&endDate=2024-12-31
   * 
   * Response on success:
   *   {
   *     success: true,
   *     message: "Income vs expense summary retrieved successfully",
   *     data: {
   *       income: 600000,
   *       expenses: 360000,
   *       savings: 240000,
   *       savingsRate: 40,
   *       details: { ... }
   *     },
   *     meta: {
   *       period: { startDate: "2024-01-01", endDate: "2024-12-31" },
   *       financialHealth: "Healthy"
   *     }
   *   }
   * 
   * Validation:
   *   - userId: Required, format U001-U999
   *   - startDate: Required, ISO format (YYYY-MM-DD)
   *   - endDate: Required, ISO format (YYYY-MM-DD)
   *   - startDate must be <= endDate
   * 
   * Financial Health Score:
   *   - Excellent: savingsRate >= 30%
   *   - Healthy: savingsRate >= 20%
   *   - Average: savingsRate >= 10%
   *   - Concerning: savingsRate < 10%
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getIncomeVsExpenseSummary = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate all parameters
    const validation = ValidationUtils.validateAnalyticsParams(
      { userId, startDate, endDate },
      'summary'
    );

    if (!validation.isValid) {
      return ResponseHandler.validationError(
        res,
        'Validation failed',
        validation.errors
      );
    }

    const { startDate: start, endDate: end } = validation.data;

    // Fetch analytics data from service
    const result = await AnalyticsService.getIncomeVsExpenseSummary(
      userId,
      start,
      end
    );

    // Determine financial health based on savings rate
    const getFinancialHealth = (rate) => {
      if (rate >= 30) return 'Excellent';
      if (rate >= 20) return 'Healthy';
      if (rate >= 10) return 'Average';
      return 'Concerning';
    };

    // Return successful response with financial health assessment
    return ResponseHandler.success(
      res,
      200,
      'Income vs expense summary retrieved successfully',
      result,
      {
        period: { startDate: startDate, endDate: endDate },
        financialHealth: getFinancialHealth(result.savingsRate),
        savingsRate: result.savingsRate,
      }
    );
  });

  /**
   * Get top merchants by spending
   * 
   * Request:
   *   GET /api/analytics/top-merchants/{userId}?limit=10&startDate=2024-01-01&endDate=2024-01-31
   * 
   * Response on success:
   *   {
   *     success: true,
   *     message: "Top merchants retrieved successfully",
   *     data: [
   *       { merchant: "Amazon", totalSpent: 15000, transactionCount: 8, averageTransaction: 1875 },
   *       ...
   *     ],
   *     meta: { limit: 10, count: 10 }
   *   }
   * 
   * Validation:
   *   - userId: Required, format U001-U999
   *   - limit: Optional, default 10, max 100
   *   - startDate: Optional, ISO format
   *   - endDate: Optional, ISO format
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getTopMerchants = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit, startDate, endDate } = req.query;

    // Validate userId
    const userIdValidation = ValidationUtils.validateUserId(userId);
    if (!userIdValidation.isValid) {
      return ResponseHandler.validationError(res, 'Invalid userId', [
        userIdValidation.error,
      ]);
    }

    // Validate limit
    const paginationValidation = ValidationUtils.validatePagination(limit, 0);
    if (!paginationValidation.isValid) {
      return ResponseHandler.validationError(res, 'Invalid limit', [
        paginationValidation.error,
      ]);
    }

    // Validate optional date range
    let startDateObj = null;
    let endDateObj = null;

    if (startDate && endDate) {
      const startValidation = ValidationUtils.validateDateString(startDate);
      const endValidation = ValidationUtils.validateDateString(endDate);

      if (!startValidation.isValid || !endValidation.isValid) {
        const errors = [];
        if (!startValidation.isValid) errors.push(startValidation.error);
        if (!endValidation.isValid) errors.push(endValidation.error);
        return ResponseHandler.validationError(res, 'Invalid dates', errors);
      }

      const rangeValidation = ValidationUtils.validateDateRange(
        startValidation.date,
        endValidation.date
      );
      if (!rangeValidation.isValid) {
        return ResponseHandler.validationError(res, 'Invalid date range', [
          rangeValidation.error,
        ]);
      }

      startDateObj = startValidation.date;
      endDateObj = endValidation.date;
    }

    // Fetch analytics data from service
    const result = await AnalyticsService.getTopMerchants(
      userId,
      paginationValidation.limit,
      startDateObj,
      endDateObj
    );

    // Check for empty results
    if (!result || result.length === 0) {
      return ResponseHandler.success(
        res,
        200,
        'No merchants found for the specified period',
        [],
        { limit: paginationValidation.limit, count: 0 }
      );
    }

    // Return successful response
    return ResponseHandler.success(
      res,
      200,
      'Top merchants retrieved successfully',
      result,
      {
        limit: paginationValidation.limit,
        count: result.length,
        totalSpent: result.reduce((sum, m) => sum + m.totalSpent, 0),
      }
    );
  });

  /**
   * Get spending trends over time
   * 
   * Request:
   *   GET /api/analytics/spending-trend/{userId}?startDate=2024-01-01&endDate=2024-01-31&groupBy=daily
   * 
   * Response on success:
   *   {
   *     success: true,
   *     message: "Spending trends retrieved successfully",
   *     data: [
   *       { period: { date: "2024-01-01" }, spending: 500, income: 50000, netFlow: 49500, transactionCount: 3 },
   *       ...
   *     ],
   *     meta: { groupBy: "daily", count: 31 }
   *   }
   * 
   * Validation:
   *   - userId: Required, format U001-U999
   *   - startDate: Required, ISO format (YYYY-MM-DD)
   *   - endDate: Required, ISO format (YYYY-MM-DD)
   *   - groupBy: Optional, values: daily, weekly, monthly (default: daily)
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getSpendingTrend = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate, groupBy } = req.query;

    // Validate all parameters including groupBy
    const validation = ValidationUtils.validateAnalyticsParams(
      { userId, startDate, endDate, groupBy },
      'trend'
    );

    if (!validation.isValid) {
      return ResponseHandler.validationError(
        res,
        'Validation failed',
        validation.errors
      );
    }

    const { startDate: start, endDate: end, groupBy: groupByValue } =
      validation.data;

    // Fetch analytics data from service
    const result = await AnalyticsService.getSpendingTrend(
      userId,
      start,
      end,
      groupByValue
    );

    // Check for empty results
    if (!result || result.length === 0) {
      return ResponseHandler.success(
        res,
        200,
        'No transaction data found for the specified period',
        [],
        { groupBy: groupByValue, count: 0 }
      );
    }

    // Calculate trend statistics
    const totalSpending = result.reduce((sum, item) => sum + item.spending, 0);
    const avgSpending = totalSpending / result.length;

    // Return successful response
    return ResponseHandler.success(
      res,
      200,
      'Spending trends retrieved successfully',
      result,
      {
        groupBy: groupByValue,
        count: result.length,
        totalSpending,
        averageSpending: Math.round(avgSpending * 100) / 100,
      }
    );
  });
}

module.exports = AnalyticsController;
