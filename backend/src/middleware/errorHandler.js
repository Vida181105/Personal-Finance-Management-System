/**
 * Global Error Handler Middleware
 * Catches all errors from routes and controllers
 * Provides consistent error responses across the API
 * 
 * Usage: app.use(errorHandler) - MUST be the last middleware registered
 */

const ResponseHandler = require('../utils/responseHandler');

/**
 * Error handler middleware function
 * Express automatically passes errors to this middleware
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Default error properties
  const errorStatus = err.status || err.statusCode || 500;
  const errorMessage = err.message || 'Internal server error';
  const errorCode = err.code || 'INTERNAL_ERROR';

  // Log error details (for debugging)
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    status: errorStatus,
    message: errorMessage,
    code: errorCode,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle specific error types
  if (errorMessage.includes('Cast to ObjectId failed')) {
    return ResponseHandler.error(
      res,
      400,
      'Invalid ID format',
      err,
      'INVALID_ID'
    );
  }

  if (errorMessage.includes('E11000')) {
    return ResponseHandler.error(
      res,
      400,
      'Duplicate field value',
      err,
      'DUPLICATE_ENTRY'
    );
  }

  if (errorMessage.includes('validation failed')) {
    return ResponseHandler.error(
      res,
      400,
      'Validation failed',
      err,
      'VALIDATION_ERROR'
    );
  }

  // MongoDB connection error
  if (errorMessage.includes('connect')) {
    return ResponseHandler.error(
      res,
      503,
      'Database connection error. Please try again later.',
      err,
      'DATABASE_ERROR'
    );
  }

  // Return standardized error response
  return ResponseHandler.error(
    res,
    errorStatus,
    errorMessage,
    process.env.NODE_ENV === 'development' ? err : null,
    errorCode
  );
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * 
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
