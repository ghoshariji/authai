const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');
const { requireActiveSubscription } = require('../middleware/subscriptionGuard');

router.use(authenticate, tenantIsolation, requireActiveSubscription);

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), departmentController.createDepartment);
router.put('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), departmentController.updateDepartment);
router.delete('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), departmentController.deleteDepartment);

module.exports = router;
