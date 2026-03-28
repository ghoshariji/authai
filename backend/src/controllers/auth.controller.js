const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const registerCollege = async (req, res, next) => {
  try {
    const result = await authService.registerCollege(req.body);

    return ApiResponse.created(res, 'College registered successfully', {
      college: result.college,
      adminUser: {
        id: result.adminUser._id,
        name: result.adminUser.name,
        email: result.adminUser.email,
        role: result.adminUser.role,
      },
      subscription: {
        plan: result.subscription.plan,
        status: result.subscription.status,
        trialEndsAt: result.subscription.trialEndsAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return ApiResponse.success(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return ApiResponse.unauthorized(res, 'Refresh token is required');
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(token);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, 'Token refreshed successfully', {
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);

    res.clearCookie('refreshToken');

    return ApiResponse.success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);

    // Always return success to prevent email enumeration
    return ApiResponse.success(
      res,
      'If an account with that email exists, a password reset OTP has been sent'
    );
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);

    return ApiResponse.success(res, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const { User } = require('../models/User');
    const { hashToken } = require('../utils/tokenUtils');

    const user = await User.findOne({ email }).select('+passwordResetOTP +passwordResetExpires');

    if (!user || !user.passwordResetOTP) {
      return ApiResponse.error(res, 'Invalid or expired OTP', 400);
    }

    if (new Date() > user.passwordResetExpires) {
      return ApiResponse.error(res, 'OTP has expired', 400);
    }

    const hashedOtp = hashToken(otp);
    if (user.passwordResetOTP !== hashedOtp) {
      return ApiResponse.error(res, 'Invalid OTP', 400);
    }

    return ApiResponse.success(res, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { User } = require('../models/User');
    const user = await User.findById(req.user.id).populate('collegeId', 'name code logo');

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    return ApiResponse.success(res, 'Profile retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCollege,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyOtp,
  getProfile,
};
