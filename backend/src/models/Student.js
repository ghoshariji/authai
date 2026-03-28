const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      trim: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required'],
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
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 1,
      max: 6,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 12,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    parentName: {
      type: String,
      trim: true,
      maxlength: [100, 'Parent name cannot exceed 100 characters'],
    },
    parentPhone: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

studentSchema.index({ collegeId: 1, studentId: 1 }, { unique: true });
studentSchema.index({ collegeId: 1, class: 1 });
studentSchema.index({ collegeId: 1, department: 1 });
studentSchema.index({ userId: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
