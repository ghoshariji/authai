const File = require('../models/File');
const { uploadCollegeFile, deleteFromCloudinary } = require('../services/cloudinary.service');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    const collegeId = req.collegeId || req.user.collegeId;
    const { folder = 'general', relatedModel, relatedId } = req.body;

    // Determine resource type from mime type
    const isImage = req.file.mimetype.startsWith('image/');
    const isAudio = req.file.mimetype.startsWith('audio/');
    const resourceType = isImage ? 'image' : isAudio ? 'video' : 'raw';

    const cloudinaryResult = await uploadCollegeFile(
      req.file.buffer,
      collegeId,
      folder,
      { resource_type: resourceType }
    );

    const file = await File.create({
      originalName: req.file.originalname,
      fileName: cloudinaryResult.public_id.split('/').pop(),
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      folder: `college-management/colleges/${collegeId}/${folder}`,
      uploadedBy: req.user.id,
      collegeId,
      relatedTo: relatedModel && relatedId ? { model: relatedModel, id: relatedId } : undefined,
    });

    return ApiResponse.created(res, 'File uploaded successfully', file);
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.collegeId || req.user.collegeId;

    const file = await File.findOne({ _id: id, collegeId });
    if (!file) {
      return ApiResponse.notFound(res, 'File not found');
    }

    // Check ownership (unless admin)
    if (
      req.user.role !== 'SUPER_ADMIN' &&
      req.user.role !== 'COLLEGE_ADMIN' &&
      file.uploadedBy.toString() !== req.user.id.toString()
    ) {
      return ApiResponse.forbidden(res, 'You can only delete your own files');
    }

    // Determine resource type from mime
    const isImage = file.mimeType.startsWith('image/');
    const isAudio = file.mimeType.startsWith('audio/');
    const resourceType = isImage ? 'image' : isAudio ? 'video' : 'raw';

    await deleteFromCloudinary(file.publicId, resourceType).catch((err) => {
      logger.warn(`Could not delete from Cloudinary: ${err.message}`);
    });

    await File.findByIdAndDelete(id);

    return ApiResponse.success(res, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getFiles = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;

    const filter = { collegeId, isActive: true };
    if (req.query.folder) filter.folder = { $regex: req.query.folder, $options: 'i' };
    if (req.query.uploadedBy) filter.uploadedBy = req.query.uploadedBy;

    const files = await File.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return ApiResponse.success(res, 'Files retrieved', files);
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile, deleteFile, getFiles };
