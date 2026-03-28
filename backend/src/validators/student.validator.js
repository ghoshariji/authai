const Joi = require('joi');
const { objectId, addressSchema, phoneSchema } = require('./common.validator');

const createStudentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).default('Student@123'),
  studentId: Joi.string().trim().max(50).required(),
  departmentId: objectId.required(),
  classId: objectId.required(),
  year: Joi.number().integer().min(1).max(6).required(),
  semester: Joi.number().integer().min(1).max(12).required(),
  rollNumber: Joi.string().trim().max(20).optional(),
  parentName: Joi.string().trim().max(100).optional(),
  parentPhone: phoneSchema.optional(),
  address: addressSchema.optional(),
  dob: Joi.date().max('now').optional(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
  admissionDate: Joi.date().default(new Date()),
});

const updateStudentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  departmentId: objectId,
  classId: objectId,
  year: Joi.number().integer().min(1).max(6),
  semester: Joi.number().integer().min(1).max(12),
  rollNumber: Joi.string().trim().max(20),
  parentName: Joi.string().trim().max(100),
  parentPhone: phoneSchema,
  address: addressSchema,
  dob: Joi.date().max('now'),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
  isActive: Joi.boolean(),
}).min(1);

const studentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  classId: objectId,
  departmentId: objectId,
  search: Joi.string().trim().max(100),
  year: Joi.number().integer().min(1).max(6),
  semester: Joi.number().integer().min(1).max(12),
  isActive: Joi.boolean().default(true),
});

module.exports = { createStudentSchema, updateStudentSchema, studentQuerySchema };
