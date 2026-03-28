const { Result, calculateGrade } = require('../models/Result');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const createResult = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { studentId, examId, subjectId, classId, marksObtained, totalMarks, status, remarks } = req.body;

    const existing = await Result.findOne({ student: studentId, exam: examId, subject: subjectId });
    if (existing) {
      return ApiResponse.error(res, 'Result already exists for this student/exam/subject', 409);
    }

    const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100;
    const grade = calculateGrade(percentage);

    const result = await Result.create({
      student: studentId,
      exam: examId,
      subject: subjectId,
      class: classId,
      collegeId,
      marksObtained,
      totalMarks,
      percentage,
      grade,
      status: status || (percentage >= 40 ? 'PASS' : 'FAIL'),
      remarks,
      gradedBy: req.user.id,
    });

    const populated = await Result.findById(result._id)
      .populate('student', 'studentId rollNumber')
      .populate('exam', 'name type')
      .populate('subject', 'name code')
      .lean();

    return ApiResponse.created(res, 'Result created successfully', populated);
  } catch (error) {
    next(error);
  }
};

const bulkCreateResults = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { examId, subjectId, classId, results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return ApiResponse.error(res, 'results array is required', 400);
    }

    const exam = await Exam.findOne({ _id: examId, collegeId });
    if (!exam) {
      return ApiResponse.notFound(res, 'Exam not found');
    }

    const operations = results.map((r) => {
      const percentage = Math.round((r.marksObtained / (r.totalMarks || exam.totalMarks)) * 100 * 100) / 100;
      const grade = calculateGrade(percentage);
      const totalMarks = r.totalMarks || exam.totalMarks;
      const passingMarks = exam.passingMarks;
      const resultStatus = r.status || (r.marksObtained >= passingMarks ? 'PASS' : 'FAIL');

      return {
        updateOne: {
          filter: { student: r.studentId, exam: examId, subject: subjectId },
          update: {
            $set: {
              student: r.studentId,
              exam: examId,
              subject: subjectId,
              class: classId,
              collegeId,
              marksObtained: r.marksObtained,
              totalMarks,
              percentage,
              grade,
              status: resultStatus,
              remarks: r.remarks || '',
              gradedBy: req.user.id,
            },
          },
          upsert: true,
        },
      };
    });

    const bulkResult = await Result.bulkWrite(operations);

    return ApiResponse.success(res, `Results saved for ${results.length} students`, {
      modified: bulkResult.modifiedCount,
      upserted: bulkResult.upsertedCount,
    });
  } catch (error) {
    next(error);
  }
};

const getResultsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = { student: studentId, collegeId };
    if (req.query.examId) filter.exam = req.query.examId;
    if (req.query.subjectId) filter.subject = req.query.subjectId;

    const [data, total] = await Promise.all([
      Result.find(filter)
        .populate('exam', 'name type date totalMarks passingMarks')
        .populate('subject', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Result.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, 'Results retrieved', data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getResultsByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = { exam: examId, collegeId };
    if (req.query.subjectId) filter.subject = req.query.subjectId;

    const [data, total] = await Promise.all([
      Result.find(filter)
        .populate({ path: 'student', select: 'studentId rollNumber', populate: { path: 'userId', select: 'name' } })
        .populate('subject', 'name code')
        .sort({ percentage: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Result.countDocuments(filter),
    ]);

    // Analytics
    const allResults = await Result.find(filter).lean();
    const passed = allResults.filter((r) => r.status === 'PASS').length;
    const avgPercentage =
      allResults.length > 0
        ? Math.round((allResults.reduce((s, r) => s + (r.percentage || 0), 0) / allResults.length) * 100) / 100
        : 0;
    const highest = allResults.reduce((max, r) => (r.percentage > max ? r.percentage : max), 0);
    const lowest = allResults.length > 0 ? allResults.reduce((min, r) => (r.percentage < min ? r.percentage : min), 100) : 0;

    return ApiResponse.paginated(res, 'Exam results retrieved', data, {
      ...buildPaginationMeta(total, page, limit),
      analytics: {
        totalStudents: allResults.length,
        passed,
        failed: allResults.length - passed,
        passPercentage: allResults.length > 0 ? Math.round((passed / allResults.length) * 100) : 0,
        avgPercentage,
        highest,
        lowest,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;
    const { marksObtained, totalMarks, status, remarks } = req.body;

    const result = await Result.findOne({ _id: id, collegeId });
    if (!result) {
      return ApiResponse.notFound(res, 'Result not found');
    }

    if (marksObtained !== undefined) result.marksObtained = marksObtained;
    if (totalMarks !== undefined) result.totalMarks = totalMarks;
    if (status !== undefined) result.status = status;
    if (remarks !== undefined) result.remarks = remarks;

    result.gradedBy = req.user.id;
    await result.save();

    return ApiResponse.success(res, 'Result updated successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createResult,
  bulkCreateResults,
  getResultsByStudent,
  getResultsByExam,
  updateResult,
};
