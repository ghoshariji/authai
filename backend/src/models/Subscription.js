const mongoose = require('mongoose');

const PLANS = {
  FREE: 'FREE',
  BASIC: 'BASIC',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
};

const PLAN_LIMITS = {
  FREE: {
    maxStudents: 50,
    maxTeachers: 5,
    storageGB: 1,
    features: ['attendance', 'notices'],
  },
  BASIC: {
    maxStudents: 200,
    maxTeachers: 20,
    storageGB: 5,
    features: ['attendance', 'notices', 'exams', 'results'],
  },
  PRO: {
    maxStudents: 1000,
    maxTeachers: 100,
    storageGB: 20,
    features: ['attendance', 'notices', 'exams', 'results', 'chat', 'syllabus'],
  },
  ENTERPRISE: {
    maxStudents: -1,
    maxTeachers: -1,
    storageGB: 100,
    features: ['all'],
  },
};

const PLAN_PRICING = {
  FREE: { monthly: 0, yearly: 0 },
  BASIC: { monthly: 29, yearly: 290 },
  PRO: { monthly: 99, yearly: 990 },
  ENTERPRISE: { monthly: 299, yearly: 2990 },
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  TRIAL: 'TRIAL',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

const subscriptionSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    plan: {
      type: String,
      enum: Object.values(PLANS),
      default: PLANS.FREE,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.TRIAL,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    limits: {
      maxStudents: { type: Number, default: PLAN_LIMITS.FREE.maxStudents },
      maxTeachers: { type: Number, default: PLAN_LIMITS.FREE.maxTeachers },
      storageGB: { type: Number, default: PLAN_LIMITS.FREE.storageGB },
      features: { type: [String], default: PLAN_LIMITS.FREE.features },
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'YEARLY'],
      default: 'MONTHLY',
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'usd',
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ collegeId: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ status: 1 });

subscriptionSchema.methods.isActive = function () {
  return (
    this.status === SUBSCRIPTION_STATUS.ACTIVE ||
    (this.status === SUBSCRIPTION_STATUS.TRIAL && this.trialEndsAt > new Date())
  );
};

subscriptionSchema.methods.hasFeature = function (feature) {
  if (this.limits.features.includes('all')) return true;
  return this.limits.features.includes(feature);
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = { Subscription, PLANS, PLAN_LIMITS, PLAN_PRICING, SUBSCRIPTION_STATUS };
