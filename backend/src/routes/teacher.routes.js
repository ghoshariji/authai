const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription, checkTeacherLimit } = require('../middleware/subscriptionGuard');

router.use(authenticate, tenantIsolation, requireActiveSubscription);

router.get('/', teacherController.getTeachers);
router.get('/:id', teacherController.getTeacherById);
router.get('/:id/classes', teacherController.getAssignedClasses);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  checkTeacherLimit,
  teacherController.createTeacher
);

router.put('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), teacherController.updateTeacher);
router.delete('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), teacherController.deleteTeacher);

module.exports = router;
