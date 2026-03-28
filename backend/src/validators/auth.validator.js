const Joi = require('joi');
const { addressSchema, phoneSchema } = require('./common.validator');

const registerCollegeSchema = Joi.object({
  collegeName: Joi.string().trim().min(2).max(200).required(),
  collegeCode: Joi.string().trim().alphanum().min(2).max(20).uppercase().required(),
  collegeEmail: Joi.string().email().lowercase().required(),
  collegePhone: phoneSchema.optional(),
  address: addressSchema.optional(),
  adminName: Joi.string().trim().min(2).max(100).required(),
  adminEmail: Joi.string().email().lowercase().required(),
  adminPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase, lowercase, number and special character',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase, lowercase, number and special character',
    }),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

module.exports = {
  registerCollegeSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
};
