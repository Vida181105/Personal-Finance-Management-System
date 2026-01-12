const { categorizeTransaction, getAvailableCategories, addCustomRule, getRulesForCategory } = require('../utils/categorizationRules');
const ResponseHandler = require('../utils/responseHandler');

class CategoryController {
  /**
   * Get All Available Categories
   * GET /api/categories
   */
  static async getCategories(req, res, next) {
    try {
      const categories = getAvailableCategories();
      return ResponseHandler.success(res, 200, 'Categories retrieved', { categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Rules for a Category
   * GET /api/categories/:categoryName/rules
   */
  static async getCategoryRules(req, res, next) {
    try {
      const { categoryName } = req.params;
      const rules = getRulesForCategory(categoryName);

      if (rules.length === 0) {
        return ResponseHandler.notFound(res, 'Category not found or has no rules');
      }

      return ResponseHandler.success(res, 200, 'Rules retrieved', {
        category: categoryName,
        rulesCount: rules.length,
        rules: rules.map((r) => r.source),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Auto-Categorize Transaction
   * POST /api/categories/categorize
   * Body: { merchantName, description }
   */
  static async categorizeTransaction(req, res, next) {
    try {
      const { merchantName, description } = req.body;

      if (!merchantName && !description) {
        return ResponseHandler.validationError(res, 'At least one of merchantName or description is required');
      }

      const category = categorizeTransaction(merchantName || '', description || '');

      return ResponseHandler.success(res, 200, 'Transaction categorized', {
        merchantName: merchantName || 'N/A',
        description: description || 'N/A',
        suggestedCategory: category,
        confidence: category !== 'Uncategorized' ? 'high' : 'low',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Categorize Multiple Transactions
   * POST /api/categories/categorize-bulk
   * Body: { transactions: [{ merchantName, description }, ...] }
   */
  static async categorizeBulk(req, res, next) {
    try {
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return ResponseHandler.validationError(res, 'Transactions must be a non-empty array');
      }

      if (transactions.length > 1000) {
        return ResponseHandler.validationError(res, 'Max 1000 transactions per request');
      }

      const categorized = transactions.map((t) => ({
        merchantName: t.merchantName || 'N/A',
        description: t.description || 'N/A',
        suggestedCategory: categorizeTransaction(t.merchantName || '', t.description || ''),
      }));

      return ResponseHandler.success(res, 200, `${categorized.length} transactions categorized`, {
        count: categorized.length,
        transactions: categorized,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add Custom Categorization Rule (Admin only)
   * POST /api/categories/:categoryName/rules
   * Body: { pattern }
   */
  static async addCategoryRule(req, res, next) {
    try {
      const { categoryName } = req.params;
      const { pattern } = req.body;

      // In production, check if user is admin
      // if (req.user.role !== 'admin') {
      //   return ResponseHandler.forbidden(res, 'Only admins can add rules');
      // }

      if (!pattern) {
        return ResponseHandler.validationError(res, 'Pattern is required');
      }

      addCustomRule(categoryName, pattern);

      return ResponseHandler.success(res, 201, 'Rule added successfully', {
        category: categoryName,
        pattern,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;
