const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
      maxlength: [200, 'Exam name cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: ['MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT'],
      required: [true, 'Exam type is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: 1,
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks is required'],
      min: 0,
    },
    instructions: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
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

examSchema.index({ collegeId: 1, class: 1 });
examSchema.index({ collegeId: 1, subject: 1 });
examSchema.index({ collegeId: 1, date: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
