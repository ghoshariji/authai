const { User, ROLES } = require('../models/User');
const College = require('../models/College');
const { Subscription } = require('../models/Subscription');
const { generateTokenPair, verifyRefreshToken, hashToken } = require('../utils/tokenUtils');
const { createFreeTrialSubscription } = require('./subscription.service');
const { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail } = require('./email.service');
const logger = require('../utils/logger');

const registerCollege = async ({ collegeName, collegeCode, collegeEmail, collegePhone, adminName, adminEmail, adminPassword, address }) => {
  // Check if admin email already exists
  const existingUser = await User.findOne({ email: adminEmail });
  if (existingUser) {
    throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
  }

  // Check if college code already exists
  const existingCollege = await College.findOne({ code: collegeCode.toUpperCase() });
  if (existingCollege) {
    throw Object.assign(new Error('College code already in use'), { statusCode: 409 });
  }

  // Create admin user first
  const adminUser = await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: ROLES.COLLEGE_ADMIN,
  });

  // Create college
  const college = await College.create({
    name: collegeName,
    code: collegeCode.toUpperCase(),
    email: collegeEmail,
    phone: collegePhone,
    address,
    adminUser: adminUser._id,
  });

  // Set collegeId on college (self-reference)
  college.collegeId = college._id;
  await college.save();

  // Update admin user with collegeId
  adminUser.collegeId = college._id;
  await adminUser.save();

  // Create free trial subscription
  const subscription = await createFreeTrialSubscription(college._id);

  // Link subscription to college
  college.subscription = subscription._id;
  await college.save();

  // Send welcome email
  await sendWelcomeEmail(adminEmail, adminName, collegeName);

  return { college, adminUser, subscription };
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user || !(await user.comparePassword(password))) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (!user.isActive) {
    throw Object.assign(new Error('Account is deactivated. Contact admin.'), { statusCode: 403 });
  }

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Save refresh token
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw Object.assign(new Error('Refresh token mismatch or user not found'), { statusCode: 401 });
  }

  if (!user.isActive) {
    throw Object.assign(new Error('Account is deactivated'), { statusCode: 403 });
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists
    return;
  }

  const otp = await sendPasswordResetEmail(email, user.name);

  // Hash OTP before storing
  user.passwordResetOTP = hashToken(otp);
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();
};

const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email }).select('+passwordResetOTP +passwordResetExpires');

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  if (!user.passwordResetOTP || !user.passwordResetExpires) {
    throw Object.assign(new Error('No password reset request found'), { statusCode: 400 });
  }

  if (new Date() > user.passwordResetExpires) {
    throw Object.assign(new Error('OTP has expired'), { statusCode: 400 });
  }

  const hashedOtp = hashToken(otp);
  if (user.passwordResetOTP !== hashedOtp) {
    throw Object.assign(new Error('Invalid OTP'), { statusCode: 400 });
  }

  user.password = newPassword;
  user.passwordResetOTP = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = null;
  await user.save();

  await sendPasswordChangedEmail(email, user.name);
};

module.exports = {
  registerCollege,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
};
