const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription, requireFeature } = require('../middleware/subscriptionGuard');
const { uploadDocument, handleMulterError } = require('../middleware/upload');

router.use(authenticate, tenantIsolation, requireActiveSubscription);

router.get('/', subjectController.getSubjects);
router.get('/:id', subjectController.getSubjectById);

router.post('/', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), subjectController.createSubject);

router.post(
  '/:id/syllabus',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'TEACHER'),
  requireFeature('syllabus'),
  uploadDocument.single('syllabus'),
  handleMulterError,
  subjectController.uploadSyllabus
);

router.put('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), subjectController.updateSubject);
router.delete('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), subjectController.deleteSubject);

module.exports = router;
