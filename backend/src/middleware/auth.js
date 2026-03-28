const { verifyAccessToken, verifyRefreshToken, generateAccessToken } = require('../utils/tokenUtils');
const { User } = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'Access token is required');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return ApiResponse.unauthorized(res, 'Access token expired');
      }
      return ApiResponse.unauthorized(res, 'Invalid access token');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found');
    }

    if (!user.isActive) {
      return ApiResponse.unauthorized(res, 'Account is deactivated');
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
      name: user.name,
    };

    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return ApiResponse.serverError(res, 'Authentication failed');
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            collegeId: user.collegeId,
            name: user.name,
          };
        }
      } catch {
        // Token invalid — proceed as unauthenticated
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
