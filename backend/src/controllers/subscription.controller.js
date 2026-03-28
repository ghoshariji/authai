const subscriptionService = require('../services/subscription.service');
const { Subscription, PLANS, PLAN_LIMITS } = require('../models/Subscription');
const { getStripe } = require('../config/stripe');
const College = require('../models/College');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const getPlans = async (req, res, next) => {
  try {
    const plans = subscriptionService.getPlansWithPricing();
    return ApiResponse.success(res, 'Plans retrieved successfully', plans);
  } catch (error) {
    next(error);
  }
};

const getCurrentSubscription = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const subscription = await subscriptionService.getSubscriptionByCollegeId(collegeId);

    if (!subscription) {
      return ApiResponse.notFound(res, 'Subscription not found');
    }

    return ApiResponse.success(res, 'Subscription retrieved successfully', subscription);
  } catch (error) {
    next(error);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const { plan, billingCycle = 'MONTHLY' } = req.body;
    const collegeId = req.collegeId || req.user.collegeId;

    if (!PLANS[plan] || plan === 'FREE') {
      return ApiResponse.error(res, 'Invalid plan selected', 400);
    }

    const college = await College.findById(collegeId).populate('adminUser', 'email name');
    if (!college) {
      return ApiResponse.notFound(res, 'College not found');
    }

    const subscription = await subscriptionService.getSubscriptionByCollegeId(collegeId);
    if (!subscription) {
      return ApiResponse.notFound(res, 'No subscription record found');
    }

    const stripe = getStripe();

    // Create or retrieve Stripe customer
    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: college.adminUser?.email || college.email,
        name: college.name,
        metadata: { collegeId: collegeId.toString() },
      });
      customerId = customer.id;
      subscription.stripeCustomerId = customerId;
      await subscription.save();
    }

    const priceKey = `${plan}_${billingCycle}`;
    const { STRIPE_PLANS } = require('../config/stripe');
    const priceId = STRIPE_PLANS[priceKey];

    if (!priceId || priceId.startsWith('price_')) {
      // For dev/test: directly upgrade without Stripe
      const updated = await subscriptionService.upgradePlan(subscription, plan, billingCycle);
      return ApiResponse.success(res, 'Subscription updated (test mode)', updated);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        collegeId: collegeId.toString(),
        plan,
        billingCycle,
      },
    });

    return ApiResponse.success(res, 'Checkout session created', {
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await subscriptionService.processStripeWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`);
    next(error);
  }
};

const upgradePlan = async (req, res, next) => {
  try {
    const { plan, billingCycle = 'MONTHLY' } = req.body;
    const collegeId = req.collegeId || req.user.collegeId;

    if (!PLANS[plan]) {
      return ApiResponse.error(res, 'Invalid plan', 400);
    }

    const subscription = await subscriptionService.getSubscriptionByCollegeId(collegeId);
    if (!subscription) {
      return ApiResponse.notFound(res, 'Subscription not found');
    }

    const updated = await subscriptionService.upgradePlan(subscription, plan, billingCycle);

    return ApiResponse.success(res, `Plan upgraded to ${plan} successfully`, updated);
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;

    const subscription = await subscriptionService.getSubscriptionByCollegeId(collegeId);
    if (!subscription) {
      return ApiResponse.notFound(res, 'Subscription not found');
    }

    const updated = await subscriptionService.cancelSubscription(subscription);

    return ApiResponse.success(res, 'Subscription cancelled successfully', updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  getCurrentSubscription,
  subscribe,
  handleWebhook,
  upgradePlan,
  cancelSubscription,
};
