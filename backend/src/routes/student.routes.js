const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { importStudents } = require('../controllers/student.import.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription, checkStudentLimit } = require('../middleware/subscriptionGuard');
const { uploadExcel } = require('../middleware/upload');

router.use(authenticate, tenantIsolation, requireActiveSubscription);

router.get('/', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'), studentController.getStudents);
router.get('/:id', studentController.getStudentById);
router.get('/:id/attendance', studentController.getStudentAttendanceSummary);
router.get('/:id/results', studentController.getStudentResults);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  checkStudentLimit,
  studentController.createStudent
);

// POST /api/students/import — bulk import from Excel
router.post(
  '/import',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  uploadExcel.single('file'),
  importStudents
);

router.put('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), studentController.updateStudent);
router.delete('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), studentController.deleteStudent);

module.exports = router;
