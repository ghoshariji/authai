const Joi = require('joi');
const { objectId } = require('./common.validator');

const createClassSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  section: Joi.string().trim().uppercase().max(10).required(),
  year: Joi.number().integer().min(1).max(6).required(),
  semester: Joi.number().integer().min(1).max(12).required(),
  departmentId: objectId.required(),
  classTeacherId: objectId.optional(),
});

const updateClassSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  section: Joi.string().trim().uppercase().max(10),
  year: Joi.number().integer().min(1).max(6),
  semester: Joi.number().integer().min(1).max(12),
  departmentId: objectId,
  classTeacherId: objectId,
  isActive: Joi.boolean(),
}).min(1);

const classQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  departmentId: objectId,
  year: Joi.number().integer().min(1).max(6),
  semester: Joi.number().integer().min(1).max(12),
  isActive: Joi.boolean().default(true),
});

module.exports = { createClassSchema, updateClassSchema, classQuerySchema };
