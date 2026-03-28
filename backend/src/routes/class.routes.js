const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription } = require('../middleware/subscriptionGuard');

router.use(authenticate, tenantIsolation, requireActiveSubscription);

router.get('/', classController.getClasses);
router.get('/:id', classController.getClassById);
router.post('/', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), classController.createClass);
router.put('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), classController.updateClass);
router.delete('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), classController.deleteClass);

module.exports = router;
