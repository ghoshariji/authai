const { cloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * Upload a file buffer to Cloudinary.
 * Folder structure: college-management/colleges/{collegeId}/{type}/
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: options.resourceType || 'auto',
      folder: options.folder || 'college-management',
      public_id: options.publicId,
      transformation: options.transformation,
      overwrite: true,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        logger.error(`Cloudinary upload error: ${error.message}`);
        reject(new Error(`Upload failed: ${error.message}`));
      } else {
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    });

    uploadStream.end(buffer);
  });
};

/**
 * Upload a file for a specific college and type.
 * @param {Buffer} buffer - File buffer
 * @param {string} collegeId - College ID
 * @param {string} type - Type subfolder (e.g., 'avatars', 'syllabus', 'notices')
 * @param {Object} options - Additional cloudinary options
 */
const uploadCollegeFile = async (buffer, collegeId, type, options = {}) => {
  const folder = `college-management/colleges/${collegeId}/${type}`;

  return uploadToCloudinary(buffer, {
    folder,
    ...options,
  });
};

/**
 * Delete a file from Cloudinary by public_id.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }

    logger.info(`Deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`Cloudinary delete error: ${error.message}`);
    throw error;
  }
};

/**
 * Get Cloudinary URL with transformations.
 */
const getTransformedUrl = (publicId, transformations = []) => {
  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
  });
};

module.exports = {
  uploadToCloudinary,
  uploadCollegeFile,
  deleteFromCloudinary,
  getTransformedUrl,
};
