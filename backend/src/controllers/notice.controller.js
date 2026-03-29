const Notice = require('../models/Notice');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { uploadCollegeFile, deleteFromCloudinary } = require('../services/cloudinary.service');
const logger = require('../utils/logger');

const createNotice = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { title, content, type, targetAudience, targetClassId, expiresAt } = req.body;

    // Handle file attachments (images/PDFs via multer .array('attachments', 5))
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';
          const result = await uploadCollegeFile(file.buffer, collegeId, 'notices', {
            resourceType,
            publicId: `notice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          });
          attachments.push({
            url: result.secure_url,
            publicId: result.public_id,
            name: file.originalname,
            type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'PDF',
            size: file.size,
          });
        } catch (err) {
          logger.error(`Notice attachment upload failed: ${err.message}`);
        }
      }
    }

    const notice = await Notice.create({
      title,
      content,
      type: type || 'GENERAL',
      targetAudience: targetAudience || 'ALL',
      targetClass: targetClassId || null,
      collegeId,
      createdBy: req.user.id,
      expiresAt: expiresAt || null,
      attachments,
    });

    const populated = await Notice.findById(notice._id)
      .populate('createdBy', 'name role')
      .populate('targetClass', 'name section')
      .lean();

    return ApiResponse.created(res, 'Notice created successfully', populated);
  } catch (error) {
    next(error);
  }
};

const getNotices = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = { collegeId, isActive: true };

    // Filter expired notices
    filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];

    if (req.query.type) filter.type = req.query.type;
    if (req.query.targetAudience) filter.targetAudience = req.query.targetAudience;

    // Role-based filtering
    if (req.user.role === 'STUDENT') {
      filter.targetAudience = { $in: ['ALL', 'STUDENTS'] };
    } else if (req.user.role === 'TEACHER') {
      filter.targetAudience = { $in: ['ALL', 'TEACHERS'] };
    }

    if (req.query.targetClassId) {
      filter.$and = [
        ...(filter.$and || []),
        { $or: [{ targetAudience: { $ne: 'CLASS' } }, { targetClass: req.query.targetClassId }] },
      ];
    }

    const [data, total] = await Promise.all([
      Notice.find(filter)
        .populate('createdBy', 'name role')
        .populate('targetClass', 'name section')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notice.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, 'Notices retrieved successfully', data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getNoticeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const notice = await Notice.findOne({ _id: id, collegeId })
      .populate('createdBy', 'name role')
      .populate('targetClass', 'name section')
      .lean();

    if (!notice) {
      return ApiResponse.notFound(res, 'Notice not found');
    }

    return ApiResponse.success(res, 'Notice retrieved successfully', notice);
  } catch (error) {
    next(error);
  }
};

const updateNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const allowed = ['title', 'content', 'type', 'targetAudience', 'isActive', 'expiresAt'];
    const updateData = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });
    if (req.body.targetClassId !== undefined) updateData.targetClass = req.body.targetClassId;

    const notice = await Notice.findOneAndUpdate(
      { _id: id, collegeId },
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name').populate('targetClass', 'name section');

    if (!notice) {
      return ApiResponse.notFound(res, 'Notice not found');
    }

    return ApiResponse.success(res, 'Notice updated successfully', notice);
  } catch (error) {
    next(error);
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const notice = await Notice.findOneAndUpdate(
      { _id: id, collegeId },
      { isActive: false },
      { new: true }
    );

    if (!notice) {
      return ApiResponse.notFound(res, 'Notice not found');
    }

    // Clean up Cloudinary attachments in background
    if (notice.attachments && notice.attachments.length > 0) {
      Promise.all(
        notice.attachments.map((a) => {
          const resourceType = a.type === 'IMAGE' ? 'image' : 'raw';
          return deleteFromCloudinary(a.publicId, resourceType).catch((e) =>
            logger.error(`Failed to delete notice attachment ${a.publicId}: ${e.message}`)
          );
        })
      );
    }

    return ApiResponse.success(res, 'Notice deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { createNotice, getNotices, getNoticeById, updateNotice, deleteNotice };
