const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter, strictLimiter } = require('../middleware/rateLimiter');
const {
  registerCollegeSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} = require('../validators/auth.validator');

// POST /api/auth/register-college
router.post(
  '/register-college',
  authLimiter,
  validate(registerCollegeSchema),
  authController.registerCollege
);

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  strictLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  strictLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// POST /api/auth/verify-otp
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);

// GET /api/auth/profile
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
