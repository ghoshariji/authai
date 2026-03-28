const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const collegeRoutes = require('./college.routes');
const subscriptionRoutes = require('./subscription.routes');
const departmentRoutes = require('./department.routes');
const classRoutes = require('./class.routes');
const studentRoutes = require('./student.routes');
const teacherRoutes = require('./teacher.routes');
const subjectRoutes = require('./subject.routes');
const attendanceRoutes = require('./attendance.routes');
const noticeRoutes = require('./notice.routes');
const examRoutes = require('./exam.routes');
const resultRoutes = require('./result.routes');
const chatRoutes = require('./chat.routes');
const fileRoutes = require('./file.routes');

router.use('/auth', authRoutes);
router.use('/colleges', collegeRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/departments', departmentRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/subjects', subjectRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/notices', noticeRoutes);
router.use('/exams', examRoutes);
router.use('/results', resultRoutes);
router.use('/chat', chatRoutes);
router.use('/files', fileRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'College Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;
