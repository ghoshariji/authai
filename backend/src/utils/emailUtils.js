const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"College Management System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const emailTemplates = {
  welcomeAdmin: (adminName, collegeName, loginUrl) => ({
    subject: `Welcome to College Management System - ${collegeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${adminName}!</h2>
        <p>Your college <strong>${collegeName}</strong> has been successfully registered.</p>
        <p>You can now login to manage your college:</p>
        <a href="${loginUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">
          Login to Dashboard
        </a>
        <p style="margin-top:24px;color:#6B7280;">If you did not create this account, please contact support.</p>
      </div>
    `,
    text: `Welcome ${adminName}! Your college ${collegeName} has been registered. Login at: ${loginUrl}`,
  }),

  passwordReset: (name, resetUrl, otp) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Use the OTP below:</p>
        <div style="background:#F3F4F6;padding:24px;border-radius:8px;text-align:center;margin:24px 0;">
          <h1 style="font-size:48px;letter-spacing:8px;color:#4F46E5;margin:0;">${otp}</h1>
          <p style="color:#6B7280;margin-top:8px;">This OTP expires in 10 minutes</p>
        </div>
        <p>Or click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
        <p style="margin-top:24px;color:#6B7280;">If you did not request this, please ignore this email.</p>
      </div>
    `,
    text: `Password reset OTP: ${otp}. Link: ${resetUrl}. Expires in 10 minutes.`,
  }),

  passwordChanged: (name) => ({
    subject: 'Password Changed Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Changed</h2>
        <p>Hello ${name},</p>
        <p>Your password has been successfully changed.</p>
        <p style="color:#DC2626;">If you did not make this change, please contact support immediately.</p>
      </div>
    `,
    text: `Hello ${name}, your password has been changed. If you did not do this, contact support immediately.`,
  }),

  studentWelcome: (studentName, collegeName, email, password) => ({
    subject: `Welcome to ${collegeName} — Your Login Credentials`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border:1px solid #E5E7EB; border-radius:12px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6C63FF,#9C63FF);padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">🎓 Welcome!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">${collegeName}</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1A1A2E;margin-top:0;">Hello, ${studentName}!</h2>
          <p style="color:#6B7280;">Your student account has been created. Use the credentials below to log in to the College Management App.</p>
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:24px;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#6B7280;font-weight:600;width:120px;">Email</td>
                <td style="padding:8px 0;color:#1A1A2E;font-weight:700;">${email}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6B7280;font-weight:600;">Password</td>
                <td style="padding:8px 0;font-size:20px;font-weight:700;color:#6C63FF;letter-spacing:2px;">${password}</td>
              </tr>
            </table>
          </div>
          <div style="background:#FFF9C4;border-left:4px solid #F59E0B;padding:16px;border-radius:4px;margin-bottom:24px;">
            <p style="margin:0;color:#92400E;font-size:14px;">⚠️ For security, please change your password after your first login.</p>
          </div>
          <p style="color:#6B7280;font-size:14px;margin:0;">If you did not expect this email, please contact your college admin.</p>
        </div>
        <div style="background:#F3F4F6;padding:16px;text-align:center;">
          <p style="margin:0;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} College Management System</p>
        </div>
      </div>
    `,
    text: `Welcome ${studentName}! Your account for ${collegeName} has been created. Email: ${email} | Password: ${password}. Please change your password after first login.`,
  }),

  subscriptionConfirmed: (collegeName, plan, expiryDate) => ({
    subject: `Subscription Confirmed - ${plan} Plan`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Subscription Confirmed!</h2>
        <p>Hello,</p>
        <p>Your subscription for <strong>${collegeName}</strong> has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr><td style="padding:8px;border:1px solid #E5E7EB;font-weight:bold;">Plan</td><td style="padding:8px;border:1px solid #E5E7EB;">${plan}</td></tr>
          <tr><td style="padding:8px;border:1px solid #E5E7EB;font-weight:bold;">Valid Until</td><td style="padding:8px;border:1px solid #E5E7EB;">${expiryDate}</td></tr>
        </table>
      </div>
    `,
    text: `Subscription confirmed for ${collegeName}. Plan: ${plan}. Valid until: ${expiryDate}`,
  }),
};

module.exports = { sendEmail, emailTemplates };
