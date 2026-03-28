const Joi = require('joi');
const { objectId, phoneSchema } = require('./common.validator');

const createTeacherSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).default('Teacher@123'),
  teacherId: Joi.string().trim().max(50).required(),
  departmentId: objectId.required(),
  qualification: Joi.string().trim().max(200).optional(),
  experience: Joi.number().min(0).default(0),
  employeeId: Joi.string().trim().max(50).optional(),
  designation: Joi.string().trim().max(100).optional(),
  joiningDate: Joi.date().default(new Date()),
});

const updateTeacherSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  departmentId: objectId,
  qualification: Joi.string().trim().max(200),
  experience: Joi.number().min(0),
  employeeId: Joi.string().trim().max(50),
  designation: Joi.string().trim().max(100),
  joiningDate: Joi.date(),
  isActive: Joi.boolean(),
}).min(1);

const teacherQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  departmentId: objectId,
  search: Joi.string().trim().max(100),
  isActive: Joi.boolean().default(true),
});

module.exports = { createTeacherSchema, updateTeacherSchema, teacherQuerySchema };
