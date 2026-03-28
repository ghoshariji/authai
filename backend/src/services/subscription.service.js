const { Subscription, PLANS, PLAN_LIMITS, PLAN_PRICING, SUBSCRIPTION_STATUS } = require('../models/Subscription');
const { getStripe, STRIPE_PLANS } = require('../config/stripe');
const logger = require('../utils/logger');

const getPlansWithPricing = () => {
  return Object.keys(PLANS).map((plan) => ({
    name: plan,
    limits: PLAN_LIMITS[plan],
    pricing: PLAN_PRICING[plan],
    stripePriceIds: {
      monthly: STRIPE_PLANS[`${plan}_MONTHLY`] || null,
      yearly: STRIPE_PLANS[`${plan}_YEARLY`] || null,
    },
  }));
};

const createFreeTrialSubscription = async (collegeId) => {
  const subscription = await Subscription.create({
    collegeId,
    plan: PLANS.FREE,
    status: SUBSCRIPTION_STATUS.TRIAL,
    limits: PLAN_LIMITS.FREE,
    billingCycle: 'MONTHLY',
    amount: 0,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return subscription;
};

const getSubscriptionByCollegeId = async (collegeId) => {
  return Subscription.findOne({ collegeId });
};

const upgradePlan = async (subscription, newPlan, billingCycle, stripeSubscriptionId = null) => {
  const limits = PLAN_LIMITS[newPlan];
  const pricing = PLAN_PRICING[newPlan];
  const amount = billingCycle === 'YEARLY' ? pricing.yearly : pricing.monthly;

  subscription.plan = newPlan;
  subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
  subscription.limits = limits;
  subscription.billingCycle = billingCycle;
  subscription.amount = amount;

  if (stripeSubscriptionId) {
    subscription.stripeSubscriptionId = stripeSubscriptionId;
  }

  subscription.currentPeriodStart = new Date();
  subscription.currentPeriodEnd = new Date(
    Date.now() + (billingCycle === 'YEARLY' ? 365 : 30) * 24 * 60 * 60 * 1000
  );

  await subscription.save();
  return subscription;
};

const cancelSubscription = async (subscription) => {
  subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
  await subscription.save();

  if (subscription.stripeSubscriptionId) {
    try {
      const stripe = getStripe();
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (err) {
      logger.error(`Failed to cancel Stripe subscription: ${err.message}`);
    }
  }

  return subscription;
};

const processStripeWebhookEvent = async (event) => {
  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const sub = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription,
      });
      if (sub) {
        sub.status = SUBSCRIPTION_STATUS.ACTIVE;
        sub.currentPeriodStart = new Date(invoice.period_start * 1000);
        sub.currentPeriodEnd = new Date(invoice.period_end * 1000);
        await sub.save();
        logger.info(`Subscription renewed for college ${sub.collegeId}`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const sub = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription,
      });
      if (sub) {
        sub.status = SUBSCRIPTION_STATUS.INACTIVE;
        await sub.save();
        logger.warn(`Subscription payment failed for college ${sub.collegeId}`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object;
      const sub = await Subscription.findOne({
        stripeSubscriptionId: stripeSub.id,
      });
      if (sub) {
        sub.status = SUBSCRIPTION_STATUS.EXPIRED;
        await sub.save();
        logger.info(`Subscription expired for college ${sub.collegeId}`);
      }
      break;
    }

    case 'checkout.session.completed': {
      const session = event.data.object;
      logger.info(`Checkout session completed: ${session.id}`);
      break;
    }

    default:
      logger.debug(`Unhandled Stripe event: ${event.type}`);
  }
};

module.exports = {
  getPlansWithPricing,
  createFreeTrialSubscription,
  getSubscriptionByCollegeId,
  upgradePlan,
  cancelSubscription,
  processStripeWebhookEvent,
};
