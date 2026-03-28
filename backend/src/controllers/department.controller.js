const Department = require('../models/Department');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const createDepartment = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { name, code, description, headId } = req.body;

    const existing = await Department.findOne({ collegeId, code: code.toUpperCase() });
    if (existing) {
      return ApiResponse.error(res, 'Department code already exists in this college', 409);
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      collegeId,
      head: headId || null,
    });

    return ApiResponse.created(res, 'Department created successfully', department);
  } catch (error) {
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = { collegeId };

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    } else {
      filter.isActive = true;
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Department.find(filter)
        .populate('head', 'userId employeeId designation')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Department.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, 'Departments retrieved successfully', data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const department = await Department.findOne({ _id: id, collegeId })
      .populate('head')
      .lean();

    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    return ApiResponse.success(res, 'Department retrieved successfully', department);
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;
    const { name, code, description, headId, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (headId !== undefined) updateData.head = headId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const department = await Department.findOneAndUpdate(
      { _id: id, collegeId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    return ApiResponse.success(res, 'Department updated successfully', department);
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const department = await Department.findOneAndUpdate(
      { _id: id, collegeId },
      { isActive: false },
      { new: true }
    );

    if (!department) {
      return ApiResponse.notFound(res, 'Department not found');
    }

    return ApiResponse.success(res, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
