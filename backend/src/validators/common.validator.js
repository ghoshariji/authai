const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Must be a valid ID',
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string(),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

const searchSchema = Joi.object({
  search: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const idParamSchema = Joi.object({
  id: objectId.required(),
});

const collegeIdParamSchema = Joi.object({
  collegeId: objectId.required(),
});

const addressSchema = Joi.object({
  street: Joi.string().trim().max(200),
  city: Joi.string().trim().max(100),
  state: Joi.string().trim().max(100),
  country: Joi.string().trim().max(100).default('India'),
  pincode: Joi.string().trim().max(10),
});

const phoneSchema = Joi.string()
  .pattern(/^[+]?[\d\s\-().]{7,15}$/)
  .messages({ 'string.pattern.base': 'Invalid phone number format' });

module.exports = {
  objectId,
  paginationSchema,
  searchSchema,
  idParamSchema,
  collegeIdParamSchema,
  addressSchema,
  phoneSchema,
};
