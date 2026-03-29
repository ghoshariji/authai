const XLSX = require('xlsx');
const { User, ROLES } = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');
const { Subscription } = require('../models/Subscription');
const { sendStudentWelcomeEmail } = require('../services/email.service');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// Generate a secure random password: 2 uppercase + 4 digits + 2 lowercase + special char
const generateRandomPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!';
  const rand = (str) => str[Math.floor(Math.random() * str.length)];

  const parts = [
    rand(upper), rand(upper),
    rand(digits), rand(digits), rand(digits), rand(digits),
    rand(lower), rand(lower),
    rand(special),
  ];

  // Shuffle
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  return parts.join('');
};

/**
 * POST /api/students/import
 * Accepts multipart form with an Excel file (.xlsx/.xls).
 * Required columns: name, email
 * Optional columns: rollNumber, year, semester, parentName, parentPhone, gender
 * Creates User + Student accounts with random passwords and sends welcome emails.
 */
const importStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'Excel file is required', 400);
    }

    const collegeId = req.collegeId || req.user.collegeId;

    // Check subscription limits before processing
    const subscription = await Subscription.findOne({ collegeId, status: { $in: ['ACTIVE', 'TRIAL'] } });
    const currentCount = await Student.countDocuments({ collegeId, isActive: true });
    const maxStudents = subscription?.limits?.maxStudents ?? 50;

    // Get college name for emails
    const college = await College.findById(collegeId).select('name').lean();
    const collegeName = college?.name || 'Your College';

    // Parse Excel from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rows.length) {
      return ApiResponse.error(res, 'Excel file is empty or has no data rows', 400);
    }

    const results = {
      total: rows.length,
      created: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };

    const classId = req.body.classId || null;
    const departmentId = req.body.departmentId || null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      // Normalize column names (case-insensitive)
      const normalized = {};
      Object.keys(row).forEach((k) => {
        normalized[k.toLowerCase().trim()] = typeof row[k] === 'string' ? row[k].trim() : row[k];
      });

      const name = normalized['name'] || normalized['student name'] || normalized['full name'] || '';
      const email = (normalized['email'] || normalized['email address'] || '').toLowerCase();

      if (!name || !email) {
        results.failed++;
        results.details.push({ row: rowNum, email: email || '—', status: 'FAILED', reason: 'Name and email are required' });
        continue;
      }

      // Email format check
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        results.failed++;
        results.details.push({ row: rowNum, email, status: 'FAILED', reason: 'Invalid email format' });
        continue;
      }

      // Check subscription limit
      if (maxStudents !== -1 && currentCount + results.created >= maxStudents) {
        results.skipped++;
        results.details.push({ row: rowNum, email, status: 'SKIPPED', reason: `Subscription limit of ${maxStudents} students reached` });
        continue;
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        results.skipped++;
        results.details.push({ row: rowNum, email, status: 'SKIPPED', reason: 'Email already registered' });
        continue;
      }

      try {
        const password = generateRandomPassword();

        // Create user
        const user = await User.create({
          name,
          email,
          password,
          role: ROLES.STUDENT,
          collegeId,
        });

        // Auto-generate studentId
        const studentCount = await Student.countDocuments({ collegeId });
        const studentId = `STU-${Date.now()}-${studentCount + 1}`;
        const rollNumber = normalized['rollnumber'] || normalized['roll number'] || normalized['roll no'] || studentId;

        // Create student profile
        await Student.create({
          userId: user._id,
          studentId,
          collegeId,
          department: departmentId || null,
          class: classId || null,
          year: parseInt(normalized['year']) || 1,
          semester: parseInt(normalized['semester']) || 1,
          rollNumber,
          parentName: normalized['parent name'] || normalized['parentname'] || '',
          parentPhone: normalized['parent phone'] || normalized['parentphone'] || '',
          gender: normalized['gender'] ? normalized['gender'].toUpperCase() : 'OTHER',
          admissionDate: new Date(),
        });

        // Send welcome email (non-blocking)
        sendStudentWelcomeEmail(email, name, collegeName, password).catch(() => {});

        results.created++;
        results.details.push({ row: rowNum, email, name, status: 'CREATED', studentId });
      } catch (err) {
        logger.error(`Import row ${rowNum} failed: ${err.message}`);
        results.failed++;
        results.details.push({ row: rowNum, email, status: 'FAILED', reason: err.message });
      }
    }

    const message = `Import complete: ${results.created} created, ${results.skipped} skipped, ${results.failed} failed`;
    logger.info(`[Import] College ${collegeId}: ${message}`);

    return ApiResponse.success(res, message, results);
  } catch (error) {
    next(error);
  }
};

module.exports = { importStudents };
