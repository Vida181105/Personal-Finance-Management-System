const express = require('express');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @description User registration
 * @body { email, password, confirmPassword, name, monthlyIncome, phone?, profession?, city?, age? }
 * @returns { user, tokens }
 */
router.post('/register', asyncHandler(AuthController.register));

/**
 * @route POST /api/auth/login
 * @description User login
 * @body { email, password }
 * @returns { user, tokens }
 */
router.post('/login', asyncHandler(AuthController.login));

/**
 * @route POST /api/auth/refresh
 * @description Refresh access token
 * @body { refreshToken }
 * @returns { tokens }
 */
router.post('/refresh', asyncHandler(AuthController.refreshToken));

/**
 * @route GET /api/auth/profile
 * @description Get current user profile (requires auth)
 * @headers { Authorization: "Bearer <token>" }
 * @returns { user }
 */
router.get('/profile', authMiddleware, asyncHandler(AuthController.getProfile));

/**
 * @route PUT /api/auth/profile
 * @description Update user profile (requires auth)
 * @headers { Authorization: "Bearer <token>" }
 * @body { name?, phone?, profession?, city?, age?, monthlyIncome? }
 * @returns { user }
 */
router.put('/profile', authMiddleware, asyncHandler(AuthController.updateProfile));

/**
 * @route POST /api/auth/change-password
 * @description Change user password (requires auth)
 * @headers { Authorization: "Bearer <token>" }
 * @body { currentPassword, newPassword, confirmPassword }
 * @returns { message }
 */
router.post('/change-password', authMiddleware, asyncHandler(AuthController.changePassword));

/**
 * @route POST /api/auth/logout
 * @description User logout (requires auth)
 * @headers { Authorization: "Bearer <token>" }
 * @returns { message }
 */
router.post('/logout', authMiddleware, asyncHandler(AuthController.logout));

module.exports = router;
