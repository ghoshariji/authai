const Stripe = require('stripe');
const logger = require('../utils/logger');

let stripeInstance = null;

const getStripe = () => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    logger.info('Stripe configured successfully');
  }
  return stripeInstance;
};

const STRIPE_PLANS = {
  BASIC_MONTHLY: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly',
  BASIC_YEARLY: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || 'price_basic_yearly',
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  ENTERPRISE_MONTHLY: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
  ENTERPRISE_YEARLY: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
};

module.exports = { getStripe, STRIPE_PLANS };
