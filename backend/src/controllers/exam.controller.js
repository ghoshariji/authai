const Exam = require('../models/Exam');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const createExam = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { name, type, subjectId, classId, date, startTime, endTime, totalMarks, passingMarks, instructions } = req.body;

    const exam = await Exam.create({
      name,
      type,
      subject: subjectId,
      class: classId,
      collegeId,
      date,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      instructions,
      createdBy: req.user.id,
    });

    const populated = await Exam.findById(exam._id)
      .populate('subject', 'name code')
      .populate('class', 'name section')
      .populate('createdBy', 'name')
      .lean();

    return ApiResponse.created(res, 'Exam created successfully', populated);
  } catch (error) {
    next(error);
  }
};

const getExams = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = { collegeId, isActive: true };
    if (req.query.classId) filter.class = req.query.classId;
    if (req.query.subjectId) filter.subject = req.query.subjectId;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.date) {
      const d = new Date(req.query.date);
      filter.date = { $gte: new Date(d.toDateString()), $lt: new Date(d.getTime() + 86400000) };
    }

    const [data, total] = await Promise.all([
      Exam.find(filter)
        .populate('subject', 'name code')
        .populate('class', 'name section year semester')
        .populate('createdBy', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Exam.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, 'Exams retrieved successfully', data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const exam = await Exam.findOne({ _id: id, collegeId })
      .populate('subject', 'name code')
      .populate('class', 'name section')
      .populate('createdBy', 'name')
      .lean();

    if (!exam) {
      return ApiResponse.notFound(res, 'Exam not found');
    }

    return ApiResponse.success(res, 'Exam retrieved successfully', exam);
  } catch (error) {
    next(error);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const allowed = ['name', 'type', 'date', 'startTime', 'endTime', 'totalMarks', 'passingMarks', 'instructions', 'isActive'];
    const updateData = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
    if (req.body.subjectId) updateData.subject = req.body.subjectId;
    if (req.body.classId) updateData.class = req.body.classId;

    const exam = await Exam.findOneAndUpdate(
      { _id: id, collegeId },
      updateData,
      { new: true, runValidators: true }
    ).populate('subject', 'name code').populate('class', 'name section');

    if (!exam) {
      return ApiResponse.notFound(res, 'Exam not found');
    }

    return ApiResponse.success(res, 'Exam updated successfully', exam);
  } catch (error) {
    next(error);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const exam = await Exam.findOneAndUpdate(
      { _id: id, collegeId },
      { isActive: false },
      { new: true }
    );

    if (!exam) {
      return ApiResponse.notFound(res, 'Exam not found');
    }

    return ApiResponse.success(res, 'Exam deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { createExam, getExams, getExamById, updateExam, deleteExam };
