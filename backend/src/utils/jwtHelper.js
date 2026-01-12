const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

class JWTHelper {
  /**
   * Generate JWT token for user
   * @param {Object} payload - Data to encode in token
   * @returns {String} JWT token
   */
  static generateToken(payload) {
    try {
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
        algorithm: 'HS256',
      });
      return token;
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Verify JWT token
   * @param {String} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
      });
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Decode token without verification (useful for debugging)
   * @param {String} token - JWT token to decode
   * @returns {Object} Decoded token payload
   */
  static decodeToken(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded;
    } catch (error) {
      throw new Error(`Token decoding failed: ${error.message}`);
    }
  }

  /**
   * Create auth tokens (access + refresh)
   * @param {String} userId - User ID
   * @param {String} email - User email
   * @returns {Object} { accessToken, refreshToken, expiresIn }
   */
  static createAuthTokens(userId, email) {
    try {
      const accessToken = this.generateToken({
        userId,
        email,
        type: 'access',
      });

      const refreshToken = jwt.sign(
        {
          userId,
          email,
          type: 'refresh',
        },
        JWT_SECRET,
        {
          expiresIn: '30d', // Refresh token lasts longer
          algorithm: 'HS256',
        }
      );

      return {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRY,
      };
    } catch (error) {
      throw new Error(`Auth token creation failed: ${error.message}`);
    }
  }

  /**
   * Extract token from Authorization header
   * @param {String} authHeader - Authorization header value
   * @returns {String} JWT token
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
}

module.exports = JWTHelper;
