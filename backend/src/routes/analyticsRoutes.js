/**
 * Analytics Routes
 * Exposes analytics endpoints with proper separation of concerns:
 * Routes → Controllers → Services → Database
 * 
 * All requests are validated and errors are handled via middleware
 */

const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');

/**
 * GET /api/analytics/monthly-spending/:userId
 * Retrieve monthly income, expenses, and savings for a specific year
 * 
 * @param {string} userId - User identifier (e.g., U001)
 * @param {number} year - Year to analyze (query param, optional, default: current year)
 * 
 * @returns {Object} Monthly breakdown with 12 entries
 */
router.get(
  '/monthly-spending/:userId',
  AnalyticsController.getMonthlySpending
);

/**
 * GET /api/analytics/category-breakdown/:userId
 * Get expenses broken down by category with percentages
 * 
 * @param {string} userId - User identifier (e.g., U001)
 * @param {string} startDate - Period start (query param, ISO format YYYY-MM-DD)
 * @param {string} endDate - Period end (query param, ISO format YYYY-MM-DD)
 * 
 * @returns {Object} Category breakdown with percentages
 */
router.get(
  '/category-breakdown/:userId',
  AnalyticsController.getCategoryBreakdown
);

/**
 * GET /api/analytics/income-vs-expense/:userId
 * Get income, expenses, savings, and savings rate summary
 * 
 * @param {string} userId - User identifier (e.g., U001)
 * @param {string} startDate - Period start (query param, ISO format YYYY-MM-DD)
 * @param {string} endDate - Period end (query param, ISO format YYYY-MM-DD)
 * 
 * @returns {Object} Financial summary with savings metrics
 */
router.get(
  '/income-vs-expense/:userId',
  AnalyticsController.getIncomeVsExpenseSummary
);

/**
 * GET /api/analytics/top-merchants/:userId
 * Get top merchants by total spending and frequency
 * 
 * @param {string} userId - User identifier (e.g., U001)
 * @param {number} limit - Number of merchants to return (query param, optional, default: 10, max: 100)
 * @param {string} startDate - Optional period start (query param, ISO format YYYY-MM-DD)
 * @param {string} endDate - Optional period end (query param, ISO format YYYY-MM-DD)
 * 
 * @returns {Array} Top merchants sorted by spending
 */
router.get('/top-merchants/:userId', AnalyticsController.getTopMerchants);

/**
 * GET /api/analytics/spending-trend/:userId
 * Get spending trends over time at daily, weekly, or monthly granularity
 * 
 * @param {string} userId - User identifier (e.g., U001)
 * @param {string} startDate - Period start (query param, ISO format YYYY-MM-DD)
 * @param {string} endDate - Period end (query param, ISO format YYYY-MM-DD)
 * @param {string} groupBy - Grouping level (query param, optional: 'daily'|'weekly'|'monthly', default: 'daily')
 * 
 * @returns {Array} Time-series spending data
 */
router.get('/spending-trend/:userId', AnalyticsController.getSpendingTrend);

module.exports = router;
