const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      maxlength: [200, 'College name cannot exceed 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'College code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'College code cannot exceed 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'College email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      pincode: { type: String, trim: true },
    },
    logo: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

collegeSchema.index({ code: 1 });
collegeSchema.index({ isActive: 1 });

collegeSchema.pre('save', function (next) {
  if (this.isNew && !this.collegeId) {
    this.collegeId = this._id;
  }
  next();
});

const College = mongoose.model('College', collegeSchema);

module.exports = College;
