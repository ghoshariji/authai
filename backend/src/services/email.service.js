const { sendEmail, emailTemplates } = require('../utils/emailUtils');
const { generateOTP } = require('../utils/tokenUtils');
const logger = require('../utils/logger');

const sendWelcomeEmail = async (adminEmail, adminName, collegeName) => {
  try {
    const loginUrl = `${process.env.CLIENT_URL}/login`;
    const template = emailTemplates.welcomeAdmin(adminName, collegeName, loginUrl);
    await sendEmail({ to: adminEmail, ...template });
    logger.info(`Welcome email sent to ${adminEmail}`);
  } catch (error) {
    logger.error(`Failed to send welcome email: ${error.message}`);
    // Don't throw — email failures shouldn't break registration
  }
};

const sendPasswordResetEmail = async (userEmail, userName) => {
  try {
    const otp = generateOTP();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?email=${encodeURIComponent(userEmail)}`;
    const template = emailTemplates.passwordReset(userName, resetUrl, otp);
    await sendEmail({ to: userEmail, ...template });
    logger.info(`Password reset email sent to ${userEmail}`);
    return otp;
  } catch (error) {
    logger.error(`Failed to send password reset email: ${error.message}`);
    throw error;
  }
};

const sendPasswordChangedEmail = async (userEmail, userName) => {
  try {
    const template = emailTemplates.passwordChanged(userName);
    await sendEmail({ to: userEmail, ...template });
    logger.info(`Password changed email sent to ${userEmail}`);
  } catch (error) {
    logger.error(`Failed to send password changed email: ${error.message}`);
  }
};

const sendSubscriptionConfirmationEmail = async (adminEmail, collegeName, plan, expiryDate) => {
  try {
    const template = emailTemplates.subscriptionConfirmed(collegeName, plan, expiryDate);
    await sendEmail({ to: adminEmail, ...template });
    logger.info(`Subscription confirmation email sent to ${adminEmail}`);
  } catch (error) {
    logger.error(`Failed to send subscription confirmation email: ${error.message}`);
  }
};

const sendStudentWelcomeEmail = async (studentEmail, studentName, collegeName, password) => {
  try {
    const template = emailTemplates.studentWelcome(studentName, collegeName, studentEmail, password);
    await sendEmail({ to: studentEmail, ...template });
    logger.info(`Student welcome email sent to ${studentEmail}`);
  } catch (error) {
    logger.error(`Failed to send student welcome email to ${studentEmail}: ${error.message}`);
    // Don't throw — log and continue importing other students
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendSubscriptionConfirmationEmail,
  sendStudentWelcomeEmail,
};
