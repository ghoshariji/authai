const multer = require('multer');
const ApiResponse = require('../utils/apiResponse');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];

const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES, ...ALLOWED_AUDIO_TYPES];

const storage = multer.memoryStorage();

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError('LIMIT_UNEXPECTED_FILE', `File type ${file.mimetype} is not allowed`),
      false
    );
  }
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
});

const uploadDocument = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter(ALLOWED_DOC_TYPES),
});

const uploadAudio = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter(ALLOWED_AUDIO_TYPES),
});

const uploadAny = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_ALL_TYPES),
});

// Multer error handler
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.error(res, 'File size exceeds the allowed limit', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return ApiResponse.error(res, err.field || 'File type not allowed', 400);
    }
    return ApiResponse.error(res, err.message, 400);
  }
  next(err);
};

module.exports = {
  uploadImage,
  uploadDocument,
  uploadAudio,
  uploadAny,
  handleMulterError,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
};
