const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['GENERAL', 'ACADEMIC', 'EXAM', 'EVENT', 'URGENT'],
      default: 'GENERAL',
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'TEACHERS', 'CLASS'],
      default: 'ALL',
    },
    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    attachments: [
      {
        url: { type: String },
        publicId: { type: String },
        originalName: { type: String },
        mimeType: { type: String },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

noticeSchema.index({ collegeId: 1, isActive: 1 });
noticeSchema.index({ collegeId: 1, targetAudience: 1 });
noticeSchema.index({ collegeId: 1, createdAt: -1 });

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
