const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/college.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');

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

module.exports = router;
