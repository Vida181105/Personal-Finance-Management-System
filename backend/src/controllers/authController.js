const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const ValidationUtils = require('../utils/validation');
const JWTHelper = require('../utils/jwtHelper');

class AuthController {
  /**
   * User Registration
   * POST /api/auth/register
   * Body: { email, password, name, monthlyIncome, phone?, profession?, city?, age? }
   */
  static async register(req, res, next) {
    try {
      const { email, password, confirmPassword, name, monthlyIncome, phone, profession, city, age } = req.body;

      // Validation
      if (!email || !password || !name || monthlyIncome === undefined) {
        return ResponseHandler.validationError(res, 'Missing required fields: email, password, name, monthlyIncome');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ResponseHandler.validationError(res, 'Invalid email format');
      }

      // Validate password strength
      if (password.length < 6) {
        return ResponseHandler.validationError(res, 'Password must be at least 6 characters');
      }

      if (password !== confirmPassword) {
        return ResponseHandler.validationError(res, 'Passwords do not match');
      }

      // Validate monthly income
      if (typeof monthlyIncome !== 'number' || monthlyIncome < 0) {
        return ResponseHandler.validationError(res, 'Monthly income must be a positive number');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return ResponseHandler.badRequest(res, 'Email already registered');
      }

      // Generate unique userId (format: U001, U002, etc.)
      const lastUser = await User.findOne().sort({ userId: -1 });
      const nextNumber = lastUser ? parseInt(lastUser.userId.slice(1)) + 1 : 1;
      const newUserId = `U${String(nextNumber).padStart(3, '0')}`;

      // Create new user
      const user = new User({
        userId: newUserId,
        email,
        password, // Will be hashed by pre-save hook
        name,
        monthlyIncome,
        phone: phone || null,
        profession: profession || null,
        city: city || null,
        age: age || null,
      });

      // Save user
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken, expiresIn } = JWTHelper.createAuthTokens(user.userId, user.email);

      // Return success response
      return ResponseHandler.success(res, 200, 'User registered successfully', {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User Login
   * POST /api/auth/login
   * Body: { email, password }
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return ResponseHandler.validationError(res, 'Email and password are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ResponseHandler.validationError(res, 'Invalid email format');
      }

      // Find user (include password for comparison)
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return ResponseHandler.badRequest(res, 'Invalid email or password');
      }

      // Compare passwords
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return ResponseHandler.badRequest(res, 'Invalid email or password');
      }

      // Activate user on login (in case they were inactive)
      user.isActive = true;

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken, expiresIn } = JWTHelper.createAuthTokens(user.userId, user.email);

      // Return success response
      return ResponseHandler.success(res, 200, 'Login successful', {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current User Profile
   * GET /api/auth/profile
   * Headers: { Authorization: "Bearer <token>" }
   */
  static async getProfile(req, res, next) {
    try {
      const userId = req.user._id;

      // Get user from database
      const user = await User.findById(userId);
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      return ResponseHandler.success(res, 200, 'User profile retrieved', {
        user: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update User Profile
   * PUT /api/auth/profile
   * Headers: { Authorization: "Bearer <token>" }
   * Body: { name?, phone?, profession?, city?, age?, monthlyIncome? }
   */
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const { name, phone, profession, city, age, monthlyIncome } = req.body;

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Update fields if provided
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (profession) user.profession = profession;
      if (city) user.city = city;
      if (age) {
        if (age < 18 || age > 120) {
          return ResponseHandler.validationError(res, 'Age must be between 18 and 120');
        }
        user.age = age;
      }
      if (monthlyIncome !== undefined) {
        if (monthlyIncome < 0) {
          return ResponseHandler.validationError(res, 'Monthly income must be positive');
        }
        user.monthlyIncome = monthlyIncome;
      }

      // Save updated user
      await user.save();

      return ResponseHandler.success(res, 200, 'Profile updated successfully', {
        user: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Password
   * POST /api/auth/change-password
   * Headers: { Authorization: "Bearer <token>" }
   * Body: { currentPassword, newPassword, confirmPassword }
   */
  static async changePassword(req, res, next) {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return ResponseHandler.validationError(res, 'All password fields are required');
      }

      if (newPassword.length < 6) {
        return ResponseHandler.validationError(res, 'New password must be at least 6 characters');
      }

      if (newPassword !== confirmPassword) {
        return ResponseHandler.validationError(res, 'New passwords do not match');
      }

      if (currentPassword === newPassword) {
        return ResponseHandler.validationError(res, 'New password must be different from current password');
      }

      // Find user (include password)
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return ResponseHandler.badRequest(res, 'Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return ResponseHandler.success(res, 200, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout (invalidate token)
   * POST /api/auth/logout
   * Headers: { Authorization: "Bearer <token>" }
   */
  static async logout(req, res, next) {
    try {
      // In a real app, you might blacklist the token
      // For now, we'll just return success
      // Token validation still happens on client side
      return ResponseHandler.success(res, 200, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Access Token
   * POST /api/auth/refresh
   * Body: { refreshToken }
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ResponseHandler.validationError(res, 'Refresh token is required');
      }

      // Verify refresh token
      const decoded = JWTHelper.verifyToken(refreshToken);

      // Find user by userId (decoded.userId is now the user's userId string like "U001")
      const user = await User.findOne({ userId: decoded.userId });
      if (!user) {
        return ResponseHandler.badRequest(res, 'User not found');
      }

      // Generate new tokens
      const { accessToken, newRefreshToken, expiresIn } = JWTHelper.createAuthTokens(user.userId, user.email);

      return ResponseHandler.success(res, 200, 'Token refreshed successfully', {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
