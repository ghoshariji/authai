const ApiResponse = require('../utils/apiResponse');

/**
 * Role-Based Access Control middleware factory.
 * Usage: authorize('SUPER_ADMIN', 'COLLEGE_ADMIN')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. Required roles: ${roles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Allow access if user has any of the given roles OR matches the resource ownership condition.
 */
const authorizeOrOwn = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    // Check if resource belongs to user (req.resourceOwnerId must be set by prior middleware)
    if (req.resourceOwnerId && req.resourceOwnerId.toString() === req.user.id.toString()) {
      return next();
    }

    return ApiResponse.forbidden(res, 'Access denied');
  };
};

module.exports = { authorize, authorizeOrOwn };
