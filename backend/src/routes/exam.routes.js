const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription, requireFeature } = require('../middleware/subscriptionGuard');

router.use(authenticate, tenantIsolation, requireActiveSubscription, requireFeature('exams'));

router.get('/', examController.getExams);
router.get('/:id', examController.getExamById);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  examController.createExam
);

router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  examController.updateExam
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  examController.deleteExam
);

module.exports = router;
