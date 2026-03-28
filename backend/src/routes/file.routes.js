const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const { authenticate } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription } = require('../middleware/subscriptionGuard');
const { uploadAny, handleMulterError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(authenticate, tenantIsolation, requireActiveSubscription);

router.get('/', fileController.getFiles);

router.post(
  '/upload',
  uploadLimiter,
  uploadAny.single('file'),
  handleMulterError,
  fileController.uploadFile
);

router.delete('/:id', fileController.deleteFile);

module.exports = router;
