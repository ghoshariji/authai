const College = require('../models/College');
const { User } = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { Subscription } = require('../models/Subscription');
const collegeRepository = require('../repositories/college.repository');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');

const getAllColleges = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const filter = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const result = await collegeRepository.findAllPaginated({ page, limit }, filter);

    return ApiResponse.paginated(res, 'Colleges retrieved successfully', result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getCollegeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const college = await collegeRepository.findWithSubscription(id);

    if (!college) {
      return ApiResponse.notFound(res, 'College not found');
    }

    return ApiResponse.success(res, 'College retrieved successfully', college);
  } catch (error) {
    next(error);
  }
};

const updateCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowedFields = ['name', 'email', 'phone', 'address', 'website', 'isActive'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const college = await College.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('subscription', 'plan status').populate('adminUser', 'name email');

    if (!college) {
      return ApiResponse.notFound(res, 'College not found');
    }

    return ApiResponse.success(res, 'College updated successfully', college);
  } catch (error) {
    next(error);
  }
};

const deleteCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const college = await College.findById(id);

    if (!college) {
      return ApiResponse.notFound(res, 'College not found');
    }

    // Soft delete — just mark inactive
    college.isActive = false;
    await college.save();

    // Deactivate all users associated with this college
    await User.updateMany({ collegeId: id }, { isActive: false, refreshToken: null });

    return ApiResponse.success(res, 'College deactivated successfully');
  } catch (error) {
    next(error);
  }
};

const getCollegeStats = async (req, res, next) => {
  try {
    const collegeId = req.params.id || req.collegeId || req.user.collegeId;

    if (!collegeId) {
      return ApiResponse.error(res, 'College ID is required', 400);
    }

    const result = await collegeRepository.getCollegeStats(collegeId);

    if (!result.college) {
      return ApiResponse.notFound(res, 'College not found');
    }

    const Department = require('../models/Department');
    const Class = require('../models/Class');

    const [departmentCount, classCount] = await Promise.all([
      Department.countDocuments({ collegeId, isActive: true }),
      Class.countDocuments({ collegeId, isActive: true }),
    ]);

    return ApiResponse.success(res, 'College stats retrieved successfully', {
      ...result,
      stats: {
        ...result.stats,
        totalDepartments: departmentCount,
        totalClasses: classCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
  getCollegeStats,
};
