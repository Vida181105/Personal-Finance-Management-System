const JWTHelper = require('../utils/jwtHelper');
const ResponseHandler = require('../utils/responseHandler');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
async function authMiddleware(req, res, next) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return ResponseHandler.unauthorized(res, 'Authorization header missing');
    }

    // Extract token
    let token;
    try {
      token = JWTHelper.extractTokenFromHeader(authHeader);
    } catch (error) {
      return ResponseHandler.unauthorized(res, error.message);
    }

    // Verify token
    let decoded;
    try {
      decoded = JWTHelper.verifyToken(token);
    } catch (error) {
      return ResponseHandler.unauthorized(res, error.message);
    }

    // Get user from database
    // decoded.userId is now the user's userId string like "U001"
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) {
      return ResponseHandler.unauthorized(res, 'User not found');
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    return ResponseHandler.unauthorized(res, 'Authentication failed');
  }
}

/**
 * Optional auth - doesn't require token but will attach user if token is provided
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    // Extract token
    let token;
    try {
      token = JWTHelper.extractTokenFromHeader(authHeader);
    } catch (error) {
      return next();
    }

    // Verify token
    let decoded;
    try {
      decoded = JWTHelper.verifyToken(token);
    } catch (error) {
      return next();
    }

    // Get user from database
    // decoded.userId is now the user's userId string like "U001"
    const user = await User.findOne({ userId: decoded.userId });
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    next();
  }
}

/**
 * Role-based authorization middleware
 * @param {Array<String>} allowedRoles - Array of allowed roles
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'User not authenticated');
    }

    if (allowedRoles.length > 0) {
      const userRole = req.user.role || 'user';
      if (!allowedRoles.includes(userRole)) {
        return ResponseHandler.forbidden(res, 'Insufficient permissions');
      }
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  authorize,
};
