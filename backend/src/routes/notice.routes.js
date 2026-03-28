const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/notice.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription, requireFeature } = require('../middleware/subscriptionGuard');

router.use(authenticate, tenantIsolation, requireActiveSubscription, requireFeature('notices'));

router.get('/', noticeController.getNotices);
router.get('/:id', noticeController.getNoticeById);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  noticeController.createNotice
);

router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  noticeController.updateNotice
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  noticeController.deleteNotice
);

module.exports = router;
