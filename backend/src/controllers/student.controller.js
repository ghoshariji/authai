const Student = require('../models/Student');
const { User, ROLES } = require('../models/User');
const studentRepository = require('../repositories/student.repository');
const { calculateAttendanceSummary } = require('../services/attendance.service');
const { Result } = require('../models/Result');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const createStudent = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const {
      name, email, password = 'Student@123',
      studentId, departmentId, classId, year, semester,
      rollNumber, parentName, parentPhone, address, dob, gender, admissionDate,
    } = req.body;

    // Check if email already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'Email already in use', 409);
    }

    // Check studentId uniqueness within college
    const existingStudent = await Student.findOne({ collegeId, studentId });
    if (existingStudent) {
      return ApiResponse.error(res, 'Student ID already exists in this college', 409);
    }

    // Create user account
    const user = await User.create({
      name,
      email,
      password,
      role: ROLES.STUDENT,
      collegeId,
    });

    // Create student profile
    const student = await Student.create({
      userId: user._id,
      studentId,
      collegeId,
      department: departmentId,
      class: classId,
      year,
      semester,
      rollNumber,
      parentName,
      parentPhone,
      address,
      dob,
      gender,
      admissionDate,
    });

    const populated = await Student.findById(student._id)
      .populate('userId', 'name email avatar')
      .populate('department', 'name code')
      .populate('class', 'name section year semester')
      .lean();

    return ApiResponse.created(res, 'Student created successfully', populated);
  } catch (error) {
    next(error);
  }
};

const getStudents = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = { collegeId };

    if (req.query.classId) filter.class = req.query.classId;
    if (req.query.departmentId) filter.department = req.query.departmentId;
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.semester) filter.semester = parseInt(req.query.semester);
    filter.isActive = req.query.isActive !== 'false';

    let data, total;

    if (req.query.search) {
      // Use search-capable method
      const allResults = await studentRepository.searchStudents(collegeId, req.query.search, filter);
      total = allResults.length;
      data = allResults.slice(skip, skip + limit);
    } else {
      [data, total] = await Promise.all([
        Student.find(filter)
          .populate('userId', 'name email avatar')
          .populate('department', 'name code')
          .populate('class', 'name section year semester')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Student.countDocuments(filter),
      ]);
    }

    return ApiResponse.paginated(
      res,
      'Students retrieved successfully',
      data,
      buildPaginationMeta(total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const student = await Student.findOne({ _id: id, collegeId })
      .populate('userId', 'name email avatar lastLogin')
      .populate('department', 'name code')
      .populate('class', 'name section year semester')
      .lean();

    if (!student) {
      return ApiResponse.notFound(res, 'Student not found');
    }

    return ApiResponse.success(res, 'Student retrieved successfully', student);
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const allowedFields = [
      'rollNumber', 'parentName', 'parentPhone', 'address',
      'dob', 'gender', 'isActive', 'year', 'semester',
    ];
    const updateData = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });
    if (req.body.classId) updateData.class = req.body.classId;
    if (req.body.departmentId) updateData.department = req.body.departmentId;

    // Update user name if provided
    if (req.body.name) {
      const student = await Student.findOne({ _id: id, collegeId }).select('userId');
      if (student) {
        await User.findByIdAndUpdate(student.userId, { name: req.body.name });
      }
    }

    const student = await Student.findOneAndUpdate(
      { _id: id, collegeId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email avatar')
      .populate('department', 'name code')
      .populate('class', 'name section');

    if (!student) {
      return ApiResponse.notFound(res, 'Student not found');
    }

    return ApiResponse.success(res, 'Student updated successfully', student);
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const student = await Student.findOneAndUpdate(
      { _id: id, collegeId },
      { isActive: false },
      { new: true }
    );

    if (!student) {
      return ApiResponse.notFound(res, 'Student not found');
    }

    // Deactivate user account
    await User.findByIdAndUpdate(student.userId, { isActive: false, refreshToken: null });

    return ApiResponse.success(res, 'Student deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getStudentAttendanceSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const student = await Student.findOne({ _id: id, collegeId });
    if (!student) {
      return ApiResponse.notFound(res, 'Student not found');
    }

    const { startDate, endDate, subjectId } = req.query;
    const summary = await calculateAttendanceSummary(student._id, collegeId, {
      startDate,
      endDate,
      subjectId,
    });

    return ApiResponse.success(res, 'Attendance summary retrieved successfully', {
      studentId: student.studentId,
      ...summary,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const student = await Student.findOne({ _id: id, collegeId });
    if (!student) {
      return ApiResponse.notFound(res, 'Student not found');
    }

    const filter = { student: student._id, collegeId };
    if (req.query.examId) filter.exam = req.query.examId;
    if (req.query.subjectId) filter.subject = req.query.subjectId;

    const results = await Result.find(filter)
      .populate('exam', 'name type date totalMarks passingMarks')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate overall stats
    const totalExams = results.length;
    const passed = results.filter((r) => r.status === 'PASS').length;
    const avgPercentage =
      totalExams > 0
        ? Math.round((results.reduce((s, r) => s + (r.percentage || 0), 0) / totalExams) * 100) / 100
        : 0;

    return ApiResponse.success(res, 'Student results retrieved successfully', {
      studentId: student.studentId,
      results,
      summary: { totalExams, passed, failed: totalExams - passed, avgPercentage },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentAttendanceSummary,
  getStudentResults,
};
