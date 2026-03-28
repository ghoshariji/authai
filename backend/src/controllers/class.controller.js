const Class = require('../models/Class');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const createClass = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { name, section, year, semester, departmentId, classTeacherId } = req.body;

    const classDoc = await Class.create({
      name,
      section: section.toUpperCase(),
      year,
      semester,
      department: departmentId,
      collegeId,
      classTeacher: classTeacherId || null,
    });

    const populated = await Class.findById(classDoc._id)
      .populate('department', 'name code')
      .populate('classTeacher')
      .lean();

    return ApiResponse.created(res, 'Class created successfully', populated);
  } catch (error) {
    next(error);
  }
};

const getClasses = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = { collegeId, isActive: true };

    if (req.query.departmentId) filter.department = req.query.departmentId;
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.semester) filter.semester = parseInt(req.query.semester);
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const [data, total] = await Promise.all([
      Class.find(filter)
        .populate('department', 'name code')
        .populate({ path: 'classTeacher', populate: { path: 'userId', select: 'name' } })
        .sort({ name: 1, section: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Class.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, 'Classes retrieved successfully', data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const classDoc = await Class.findOne({ _id: id, collegeId })
      .populate('department', 'name code')
      .populate({ path: 'classTeacher', populate: { path: 'userId', select: 'name email' } })
      .lean();

    if (!classDoc) {
      return ApiResponse.notFound(res, 'Class not found');
    }

    return ApiResponse.success(res, 'Class retrieved successfully', classDoc);
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const updateData = {};
    const allowed = ['name', 'section', 'year', 'semester', 'isActive'];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });
    if (req.body.departmentId) updateData.department = req.body.departmentId;
    if (req.body.classTeacherId !== undefined) updateData.classTeacher = req.body.classTeacherId;

    const classDoc = await Class.findOneAndUpdate(
      { _id: id, collegeId },
      updateData,
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    if (!classDoc) {
      return ApiResponse.notFound(res, 'Class not found');
    }

    return ApiResponse.success(res, 'Class updated successfully', classDoc);
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const classDoc = await Class.findOneAndUpdate(
      { _id: id, collegeId },
      { isActive: false },
      { new: true }
    );

    if (!classDoc) {
      return ApiResponse.notFound(res, 'Class not found');
    }

    return ApiResponse.success(res, 'Class deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { createClass, getClasses, getClassById, updateClass, deleteClass };
