const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { tenantIsolation } = require('../middleware/tenantIsolation');

// Public — list plans
router.get('/plans', subscriptionController.getPlans);

// Stripe webhook — raw body required
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleWebhook
);

router.use(authenticate);

// GET /api/subscriptions/current
router.get('/current', tenantIsolation, subscriptionController.getCurrentSubscription);

// POST /api/subscriptions/subscribe
router.post(
  '/subscribe',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  tenantIsolation,
  subscriptionController.subscribe
);

// PUT /api/subscriptions/upgrade
router.put(
  '/upgrade',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  tenantIsolation,
  subscriptionController.upgradePlan
);

// DELETE /api/subscriptions/cancel
router.delete(
  '/cancel',
  authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'),
  tenantIsolation,
  subscriptionController.cancelSubscription
);

module.exports = router;
