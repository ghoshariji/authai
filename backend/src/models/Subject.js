const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required'],
    },
    credits: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    syllabus: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ collegeId: 1, code: 1, class: 1 }, { unique: true });
subjectSchema.index({ collegeId: 1, department: 1 });
subjectSchema.index({ collegeId: 1, class: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
