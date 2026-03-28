const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { bulkMarkAttendance, calculateAttendanceSummary } = require('../services/attendance.service');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const markAttendance = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { classId, subjectId, date, records } = req.body;

    // records: [{ studentId, status }]
    if (!Array.isArray(records) || records.length === 0) {
      return ApiResponse.error(res, 'records array is required and must not be empty', 400);
    }

    // Resolve teacher profile
    const teacher = await Teacher.findOne({ userId: req.user.id, collegeId });
    if (!teacher && req.user.role !== 'COLLEGE_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return ApiResponse.forbidden(res, 'Only teachers can mark attendance');
    }

    const markedById = teacher ? teacher._id : req.user.id;

    const result = await bulkMarkAttendance(records, {
      classId,
      subjectId,
      collegeId,
      date,
      markedBy: markedById,
    });

    return ApiResponse.success(res, `Attendance marked for ${records.length} students`, {
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
      total: records.length,
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceByClassAndDate = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { classId, subjectId, date } = req.query;

    if (!classId || !subjectId || !date) {
      return ApiResponse.error(res, 'classId, subjectId and date are required', 400);
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      class: classId,
      subject: subjectId,
      collegeId,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate({
        path: 'student',
        select: 'studentId rollNumber',
        populate: { path: 'userId', select: 'name' },
      })
      .populate('markedBy', 'teacherId')
      .lean();

    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
    };

    return ApiResponse.success(res, 'Attendance retrieved successfully', { date, records, summary });
  } catch (error) {
    next(error);
  }
};

const getStudentAttendanceSummary = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { studentId } = req.params;
    const { startDate, endDate, subjectId } = req.query;

    const student = await Student.findOne({ _id: studentId, collegeId });
    if (!student) {
      return ApiResponse.notFound(res, 'Student not found');
    }

    const summary = await calculateAttendanceSummary(student._id, collegeId, {
      startDate,
      endDate,
      subjectId,
    });

    return ApiResponse.success(res, 'Attendance summary retrieved', { student: student.studentId, ...summary });
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;
    const { status } = req.body;

    if (!['PRESENT', 'ABSENT', 'LATE'].includes(status)) {
      return ApiResponse.error(res, 'Invalid status. Use PRESENT, ABSENT or LATE', 400);
    }

    const attendance = await Attendance.findOneAndUpdate(
      { _id: id, collegeId },
      { status },
      { new: true }
    );

    if (!attendance) {
      return ApiResponse.notFound(res, 'Attendance record not found');
    }

    return ApiResponse.success(res, 'Attendance updated successfully', attendance);
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;

    // Resolve student from logged-in user
    const student = await Student.findOne({ userId: req.user.id, collegeId });
    if (!student) {
      return ApiResponse.notFound(res, 'Student profile not found');
    }

    const { startDate, endDate } = req.query;

    const summary = await calculateAttendanceSummary(student._id, collegeId, { startDate, endDate });

    return ApiResponse.success(res, 'My attendance retrieved', { ...summary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendanceByClassAndDate,
  getStudentAttendanceSummary,
  updateAttendance,
  getMyAttendance,
};
