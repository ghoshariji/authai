const Teacher = require('../models/Teacher');
const { User, ROLES } = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const createTeacher = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const {
      name, email, password = 'Teacher@123',
      teacherId, departmentId, qualification,
      experience, employeeId, designation, joiningDate,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'Email already in use', 409);
    }

    const existingTeacher = await Teacher.findOne({ collegeId, teacherId });
    if (existingTeacher) {
      return ApiResponse.error(res, 'Teacher ID already exists in this college', 409);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: ROLES.TEACHER,
      collegeId,
    });

    const teacher = await Teacher.create({
      userId: user._id,
      teacherId,
      collegeId,
      department: departmentId,
      qualification,
      experience: experience || 0,
      employeeId,
      designation,
      joiningDate,
    });

    const populated = await Teacher.findById(teacher._id)
      .populate('userId', 'name email avatar')
      .populate('department', 'name code')
      .lean();

    return ApiResponse.created(res, 'Teacher created successfully', populated);
  } catch (error) {
    next(error);
  }
};

const getTeachers = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = { collegeId, isActive: true };
    if (req.query.departmentId) filter.department = req.query.departmentId;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    let query = Teacher.find(filter);

    if (req.query.search) {
      const userIds = await User.find({
        name: { $regex: req.query.search, $options: 'i' },
        collegeId,
      }).select('_id');
      filter.$or = [
        { userId: { $in: userIds.map((u) => u._id) } },
        { teacherId: { $regex: req.query.search, $options: 'i' } },
        { employeeId: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Teacher.find(filter)
        .populate('userId', 'name email avatar')
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Teacher.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, 'Teachers retrieved successfully', data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getTeacherById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const teacher = await Teacher.findOne({ _id: id, collegeId })
      .populate('userId', 'name email avatar lastLogin')
      .populate('department', 'name code')
      .populate('subjects', 'name code')
      .lean();

    if (!teacher) {
      return ApiResponse.notFound(res, 'Teacher not found');
    }

    return ApiResponse.success(res, 'Teacher retrieved successfully', teacher);
  } catch (error) {
    next(error);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const allowedFields = ['qualification', 'experience', 'employeeId', 'designation', 'joiningDate', 'isActive'];
    const updateData = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });
    if (req.body.departmentId) updateData.department = req.body.departmentId;

    if (req.body.name) {
      const teacher = await Teacher.findOne({ _id: id, collegeId }).select('userId');
      if (teacher) {
        await User.findByIdAndUpdate(teacher.userId, { name: req.body.name });
      }
    }

    const teacher = await Teacher.findOneAndUpdate(
      { _id: id, collegeId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email avatar')
      .populate('department', 'name code');

    if (!teacher) {
      return ApiResponse.notFound(res, 'Teacher not found');
    }

    return ApiResponse.success(res, 'Teacher updated successfully', teacher);
  } catch (error) {
    next(error);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const teacher = await Teacher.findOneAndUpdate(
      { _id: id, collegeId },
      { isActive: false },
      { new: true }
    );

    if (!teacher) {
      return ApiResponse.notFound(res, 'Teacher not found');
    }

    await User.findByIdAndUpdate(teacher.userId, { isActive: false, refreshToken: null });

    return ApiResponse.success(res, 'Teacher deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getAssignedClasses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const teacher = await Teacher.findOne({ _id: id, collegeId });
    if (!teacher) {
      return ApiResponse.notFound(res, 'Teacher not found');
    }

    const subjects = await Subject.find({
      teacher: teacher._id,
      collegeId,
      isActive: true,
    })
      .populate('class', 'name section year semester')
      .populate('department', 'name code')
      .lean();

    const classIds = [...new Set(subjects.map((s) => s.class?._id?.toString()))].filter(Boolean);
    const classes = await Class.find({ _id: { $in: classIds }, collegeId })
      .populate('department', 'name code')
      .lean();

    return ApiResponse.success(res, 'Assigned classes retrieved successfully', {
      teacher: { id: teacher._id, teacherId: teacher.teacherId },
      subjects,
      classes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getAssignedClasses,
};
