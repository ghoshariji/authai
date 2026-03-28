const express = require('express');
const router = express.Router();
const resultController = require('../controllers/result.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription, requireFeature } = require('../middleware/subscriptionGuard');

router.use(authenticate, tenantIsolation, requireActiveSubscription, requireFeature('results'));

// GET results by student
router.get('/student/:studentId', resultController.getResultsByStudent);

// GET results by exam
router.get('/exam/:examId', resultController.getResultsByExam);

// POST create single result
router.post(
  '/',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  resultController.createResult
);

// POST bulk create results
router.post(
  '/bulk',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  resultController.bulkCreateResults
);

// PUT update result
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  resultController.updateResult
);

module.exports = router;
