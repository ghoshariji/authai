const { Subscription } = require('../models/Subscription');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Check that the college subscription is active (ACTIVE or TRIAL within date).
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    if (!collegeId) return next();

    const subscription = await Subscription.findOne({ collegeId });

    if (!subscription) {
      return ApiResponse.forbidden(res, 'No active subscription found');
    }

    if (!subscription.isActive()) {
      return ApiResponse.forbidden(
        res,
        'Subscription expired or inactive. Please renew your subscription.'
      );
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    logger.error(`Subscription guard error: ${error.message}`);
    return ApiResponse.serverError(res, 'Failed to verify subscription');
  }
};

/**
 * Check that a specific feature is available in the current plan.
 */
const requireFeature = (feature) => async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    if (!collegeId) return next();

    const subscription = req.subscription || (await Subscription.findOne({ collegeId }));

    if (!subscription || !subscription.isActive()) {
      return ApiResponse.forbidden(res, 'Active subscription required');
    }

    if (!subscription.hasFeature(feature)) {
      return ApiResponse.forbidden(
        res,
        `Feature "${feature}" is not available in your current plan. Please upgrade.`
      );
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    logger.error(`Feature guard error: ${error.message}`);
    return ApiResponse.serverError(res, 'Failed to verify subscription feature');
  }
};

/**
 * Check student count against subscription limit before creating a student.
 */
const checkStudentLimit = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    if (!collegeId) return next();

    const subscription = req.subscription || (await Subscription.findOne({ collegeId }));

    if (!subscription || !subscription.isActive()) {
      return ApiResponse.forbidden(res, 'Active subscription required');
    }

    const { maxStudents } = subscription.limits;

    // -1 means unlimited
    if (maxStudents === -1) return next();

    const currentCount = await Student.countDocuments({ collegeId, isActive: true });

    if (currentCount >= maxStudents) {
      return ApiResponse.forbidden(
        res,
        `Student limit reached (${maxStudents}). Please upgrade your plan to add more students.`
      );
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    logger.error(`Student limit check error: ${error.message}`);
    return ApiResponse.serverError(res, 'Failed to verify student limit');
  }
};

/**
 * Check teacher count against subscription limit before creating a teacher.
 */
const checkTeacherLimit = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    if (!collegeId) return next();

    const subscription = req.subscription || (await Subscription.findOne({ collegeId }));

    if (!subscription || !subscription.isActive()) {
      return ApiResponse.forbidden(res, 'Active subscription required');
    }

    const { maxTeachers } = subscription.limits;

    if (maxTeachers === -1) return next();

    const currentCount = await Teacher.countDocuments({ collegeId, isActive: true });

    if (currentCount >= maxTeachers) {
      return ApiResponse.forbidden(
        res,
        `Teacher limit reached (${maxTeachers}). Please upgrade your plan to add more teachers.`
      );
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    logger.error(`Teacher limit check error: ${error.message}`);
    return ApiResponse.serverError(res, 'Failed to verify teacher limit');
  }
};

module.exports = {
  requireActiveSubscription,
  requireFeature,
  checkStudentLimit,
  checkTeacherLimit,
};
