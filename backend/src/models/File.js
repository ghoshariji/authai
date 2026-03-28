const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Public ID is required'],
    },
    folder: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded by is required'],
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required'],
    },
    relatedTo: {
      model: {
        type: String,
        enum: ['Student', 'Teacher', 'Subject', 'Notice', 'Message', 'College'],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
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

fileSchema.index({ collegeId: 1, uploadedBy: 1 });
fileSchema.index({ collegeId: 1, isActive: 1 });
fileSchema.index({ publicId: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;
