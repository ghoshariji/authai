const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription, requireFeature } = require('../middleware/subscriptionGuard');

router.use(authenticate, tenantIsolation, requireActiveSubscription, requireFeature('attendance'));

// POST /api/attendance/mark — bulk mark
router.post(
  '/mark',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  attendanceController.markAttendance
);

// GET /api/attendance — by class and date
router.get(
  '/',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  attendanceController.getAttendanceByClassAndDate
);

// GET /api/attendance/my — student's own attendance
router.get('/my', authorize('STUDENT'), attendanceController.getMyAttendance);

// GET /api/attendance/student/:studentId/summary
router.get(
  '/student/:studentId/summary',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  attendanceController.getStudentAttendanceSummary
);

// PUT /api/attendance/:id
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  attendanceController.updateAttendance
);

module.exports = router;
