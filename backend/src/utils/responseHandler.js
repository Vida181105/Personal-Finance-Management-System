/**
 * Response Handler Utility
 * Standardizes all API responses for consistency and maintainability
 * 
 * Used in: All controllers and middleware
 * Pattern: { success: boolean, message: string, data?: any, meta?: any }
 */

class ResponseHandler {
  /**
   * Send a successful response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code (default: 200)
   * @param {string} message - Success message
   * @param {any} data - Response data
   * @param {Object} meta - Optional metadata (pagination, count, etc.)
   */
  static success(res, statusCode = 200, message, data = null, meta = null) {
    const response = {
      success: true,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a successful response with list data
   * @param {Object} res - Express response object
   * @param {Array} items - Array of items
   * @param {string} message - Success message
   * @param {number} total - Total count (for pagination context)
   */
  static successList(res, items, message = 'Data retrieved successfully', total = items.length) {
    return res.status(200).json({
      success: true,
      message,
      data: items,
      meta: {
        count: items.length,
        total,
      },
    });
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} error - Error details (for development)
   * @param {string} code - Custom error code for frontend parsing
   */
  static error(res, statusCode = 500, message, error = null, code = null) {
    const response = {
      success: false,
      message,
    };

    // Include error details in development only
    if (process.env.NODE_ENV === 'development' && error) {
      response.error = {
        message: error.message || error,
        code: code || 'INTERNAL_ERROR',
      };
    }

    // Always include code for frontend error handling
    if (code) {
      response.code = code;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {Array} errors - Array of validation errors
   */
  static validationError(res, message = 'Validation failed', errors = []) {
    return res.status(400).json({
      success: false,
      message,
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name (e.g., 'User')
   */
  static notFound(res, resource = 'Resource') {
    return res.status(404).json({
      success: false,
      message: `${resource} not found`,
      code: 'NOT_FOUND',
    });
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message,
      code: 'UNAUTHORIZED',
    });
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   */
  static forbidden(res, message = 'Access forbidden') {
    return res.status(403).json({
      success: false,
      message,
      code: 'FORBIDDEN',
    });
  }

  /**
   * Send bad request response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static badRequest(res, message = 'Bad request') {
    return res.status(400).json({
      success: false,
      message,
      code: 'BAD_REQUEST',
    });
  }
}

module.exports = ResponseHandler;
