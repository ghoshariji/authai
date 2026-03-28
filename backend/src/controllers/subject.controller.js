const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { uploadCollegeFile, deleteFromCloudinary } = require('../services/cloudinary.service');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const createSubject = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { name, code, departmentId, classId, teacherId, credits } = req.body;

    const existing = await Subject.findOne({ collegeId, code: code.toUpperCase(), class: classId });
    if (existing) {
      return ApiResponse.error(res, 'Subject code already exists for this class', 409);
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      department: departmentId,
      class: classId,
      teacher: teacherId || null,
      collegeId,
      credits: credits || 3,
    });

    // Add to teacher's subjects list if teacher assigned
    if (teacherId) {
      await Teacher.findByIdAndUpdate(teacherId, { $addToSet: { subjects: subject._id } });
    }

    const populated = await Subject.findById(subject._id)
      .populate('department', 'name code')
      .populate('class', 'name section')
      .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
      .lean();

    return ApiResponse.created(res, 'Subject created successfully', populated);
  } catch (error) {
    next(error);
  }
};

const getSubjects = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = { collegeId, isActive: true };
    if (req.query.classId) filter.class = req.query.classId;
    if (req.query.departmentId) filter.department = req.query.departmentId;
    if (req.query.teacherId) filter.teacher = req.query.teacherId;

    const [data, total] = await Promise.all([
      Subject.find(filter)
        .populate('department', 'name code')
        .populate('class', 'name section year semester')
        .populate({ path: 'teacher', populate: { path: 'userId', select: 'name' } })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subject.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, 'Subjects retrieved successfully', data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const subject = await Subject.findOne({ _id: id, collegeId })
      .populate('department', 'name code')
      .populate('class', 'name section year semester')
      .populate({ path: 'teacher', populate: { path: 'userId', select: 'name email' } })
      .lean();

    if (!subject) {
      return ApiResponse.notFound(res, 'Subject not found');
    }

    return ApiResponse.success(res, 'Subject retrieved successfully', subject);
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const updateData = {};
    const allowed = ['name', 'credits', 'isActive'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
    if (req.body.departmentId) updateData.department = req.body.departmentId;
    if (req.body.classId) updateData.class = req.body.classId;
    if (req.body.teacherId !== undefined) updateData.teacher = req.body.teacherId;

    const subject = await Subject.findOneAndUpdate(
      { _id: id, collegeId },
      updateData,
      { new: true, runValidators: true }
    ).populate('department', 'name code').populate('class', 'name section');

    if (!subject) {
      return ApiResponse.notFound(res, 'Subject not found');
    }

    return ApiResponse.success(res, 'Subject updated successfully', subject);
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const subject = await Subject.findOneAndUpdate(
      { _id: id, collegeId },
      { isActive: false },
      { new: true }
    );

    if (!subject) {
      return ApiResponse.notFound(res, 'Subject not found');
    }

    return ApiResponse.success(res, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};

const uploadSyllabus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    const subject = await Subject.findOne({ _id: id, collegeId });
    if (!subject) {
      return ApiResponse.notFound(res, 'Subject not found');
    }

    // Delete old syllabus if exists
    if (subject.syllabus?.publicId) {
      await deleteFromCloudinary(subject.syllabus.publicId, 'raw').catch(() => {});
    }

    const result = await uploadCollegeFile(
      req.file.buffer,
      collegeId,
      'syllabus',
      { resource_type: 'raw', public_id: `syllabus_${id}` }
    );

    subject.syllabus = { url: result.secure_url, publicId: result.public_id };
    await subject.save();

    return ApiResponse.success(res, 'Syllabus uploaded successfully', subject);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  uploadSyllabus,
};
