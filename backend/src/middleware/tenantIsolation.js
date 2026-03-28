const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../models/User');

/**
 * Ensures that every request is scoped to the correct college (tenant).
 * - SUPER_ADMIN can access any college by providing collegeId in params/query/body.
 * - All other roles can only access their own college.
 * Sets req.collegeId for use in controllers/repositories.
 */
const tenantIsolation = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    // Super admin can scope to a specific college or access all
    const collegeId =
      req.params.collegeId ||
      req.query.collegeId ||
      (req.body && req.body.collegeId) ||
      null;

    req.collegeId = collegeId || null;
    return next();
  }

  // For all other roles, enforce their own collegeId
  if (!req.user.collegeId) {
    return ApiResponse.forbidden(res, 'No college associated with your account');
  }

  // Validate if a collegeId was passed in request — it must match
  const requestedCollegeId =
    req.params.collegeId ||
    req.query.collegeId ||
    (req.body && req.body.collegeId);

  if (requestedCollegeId && requestedCollegeId.toString() !== req.user.collegeId.toString()) {
    return ApiResponse.forbidden(res, 'Cross-tenant access denied');
  }

  req.collegeId = req.user.collegeId;
  next();
};

/**
 * Strict version — always requires a collegeId to be resolvable.
 */
const requireTenant = (req, res, next) => {
  tenantIsolation(req, res, () => {
    if (!req.collegeId && req.user.role !== ROLES.SUPER_ADMIN) {
      return ApiResponse.forbidden(res, 'College context is required');
    }
    next();
  });
};

module.exports = { tenantIsolation, requireTenant };
