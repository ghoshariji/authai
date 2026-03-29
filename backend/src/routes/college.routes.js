const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/college.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription } = require('../middleware/subscriptionGuard');

router.use(authenticate);

// GET /api/colleges — SUPER_ADMIN only
router.get('/', authorize('SUPER_ADMIN'), collegeController.getAllColleges);

// GET /api/colleges/stats — own college stats (admin/teacher)
router.get(
  '/stats',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  tenantIsolation,
  collegeController.getCollegeStats
);

// GET /api/colleges/:id
router.get('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), collegeController.getCollegeById);

// GET /api/colleges/:id/stats
router.get(
  '/:id/stats',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  collegeController.getCollegeStats
);

// PUT /api/colleges/:id
router.put('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), collegeController.updateCollege);

// DELETE /api/colleges/:id — SUPER_ADMIN only
router.delete('/:id', authorize('SUPER_ADMIN'), collegeController.deleteCollege);

// GET/PUT /api/colleges/feature-config — college admin manages own college feature flags
router.get(
  '/feature-config',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER', 'STUDENT'),
  tenantIsolation,
  requireActiveSubscription,
  collegeController.getFeatureConfig
);
router.put(
  '/feature-config',
  authorize('COLLEGE_ADMIN'),
  tenantIsolation,
  requireActiveSubscription,
  collegeController.updateFeatureConfig
);

module.exports = router;
