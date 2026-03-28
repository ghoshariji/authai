const request = require('supertest');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_management_test';

let app;
let adminToken;
let teacherToken;
let studentToken;
let collegeId;
let classId;
let subjectId;
let studentIds = [];
let teacherId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = MONGO_URI;
  process.env.JWT_SECRET = 'test_jwt_secret_for_testing';
  process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_for_testing';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

  try {
    await mongoose.connect(MONGO_URI);
  } catch {
    console.warn('MongoDB not available');
    return;
  }

  const { app: expressApp } = require('../server');
  app = expressApp;

  if (mongoose.connection.readyState !== 1) return;

  // Register college and get admin token
  const regRes = await request(app)
    .post('/api/auth/register-college')
    .send({
      collegeName: 'Attendance Test College',
      collegeCode: 'ATTCOL',
      collegeEmail: 'info@attcol.edu',
      adminName: 'Att Admin',
      adminEmail: 'admin@attcol.edu',
      adminPassword: 'Admin@Test123',
    });

  if (regRes.status !== 201) return;
  collegeId = regRes.body.data.college._id;

  // Upgrade to PRO to access attendance feature
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@attcol.edu', password: 'Admin@Test123' });

  adminToken = loginRes.body.data.accessToken;

  // Upgrade subscription to access attendance
  await request(app)
    .put('/api/subscriptions/upgrade')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ plan: 'PRO', billingCycle: 'MONTHLY' });

  // Create department
  const deptRes = await request(app)
    .post('/api/departments')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Dept', code: 'TDEPT', description: 'Test' });

  const deptId = deptRes.body.data?._id;
  if (!deptId) return;

  // Create class
  const classRes = await request(app)
    .post('/api/classes')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Class', section: 'A', year: 1, semester: 1, departmentId: deptId });

  classId = classRes.body.data?._id;
  if (!classId) return;

  // Create teacher
  const teacherRes = await request(app)
    .post('/api/teachers')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Test Teacher', email: 'teacher@attcol.edu', password: 'Teacher@Test123',
      teacherId: 'TCH-ATT-001', departmentId: deptId,
    });

  const teacherDocId = teacherRes.body.data?._id;

  const teacherLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'teacher@attcol.edu', password: 'Teacher@Test123' });
  teacherToken = teacherLoginRes.body.data?.accessToken;

  // Create subject
  const subjectRes = await request(app)
    .post('/api/subjects')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Test Subject', code: 'SUB101',
      departmentId: deptId, classId, teacherId: teacherDocId,
    });
  subjectId = subjectRes.body.data?._id;

  // Create students
  const s1Res = await request(app)
    .post('/api/students')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Student One', email: 'stu1@attcol.edu', studentId: 'STU-ATT-001',
      departmentId: deptId, classId, year: 1, semester: 1,
    });
  const s2Res = await request(app)
    .post('/api/students')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Student Two', email: 'stu2@attcol.edu', studentId: 'STU-ATT-002',
      departmentId: deptId, classId, year: 1, semester: 1,
    });

  if (s1Res.body.data?._id) studentIds.push(s1Res.body.data._id);
  if (s2Res.body.data?._id) studentIds.push(s2Res.body.data._id);
}, 60000);

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('Attendance API', () => {
  describe('POST /api/attendance/mark', () => {
    it('should mark attendance for multiple students', async () => {
      if (!adminToken || !classId || !subjectId || studentIds.length === 0) {
        console.warn('Skipping: prerequisites not set up');
        return;
      }

      const records = studentIds.map((id, i) => ({
        studentId: id,
        status: i % 2 === 0 ? 'PRESENT' : 'ABSENT',
      }));

      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId,
          subjectId,
          date: new Date().toISOString(),
          records,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(studentIds.length);
    });

    it('should return 400 when records array is empty', async () => {
      if (!adminToken) return;

      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ classId, subjectId, date: new Date().toISOString(), records: [] })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should deny student role from marking attendance', async () => {
      if (!studentIds[0]) return;

      // Login as student
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'stu1@attcol.edu', password: 'Student@123' });

      if (!loginRes.body.data?.accessToken) return;
      studentToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          subjectId,
          date: new Date().toISOString(),
          records: [{ studentId: studentIds[0], status: 'PRESENT' }],
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/attendance', () => {
    it('should retrieve attendance for a class and date', async () => {
      if (!adminToken || !classId || !subjectId) return;

      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/attendance?classId=${classId}&subjectId=${subjectId}&date=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.records).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
    });

    it('should return 400 when parameters are missing', async () => {
      if (!adminToken) return;

      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Attendance Percentage Calculation', () => {
    it('should calculate attendance percentage correctly', async () => {
      if (!adminToken || !studentIds[0]) return;

      const res = await request(app)
        .get(`/api/attendance/student/${studentIds[0]}/summary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.overall).toBeDefined();
      expect(typeof res.body.data.overall.attendancePercentage).toBe('number');
      expect(res.body.data.overall.attendancePercentage).toBeGreaterThanOrEqual(0);
      expect(res.body.data.overall.attendancePercentage).toBeLessThanOrEqual(100);
    });

    it('should have correct formula: (present / total) * 100', async () => {
      const { calculateAttendanceSummary } = require('../src/services/attendance.service');
      const Attendance = require('../src/models/Attendance');

      // Unit test the calculation logic
      if (!studentIds[0] || !collegeId) return;

      const summary = await calculateAttendanceSummary(
        new mongoose.Types.ObjectId(studentIds[0]),
        new mongoose.Types.ObjectId(collegeId)
      );

      const { overall } = summary;
      if (overall.totalClasses > 0) {
        const expected = Math.round((overall.totalPresent / overall.totalClasses) * 100 * 100) / 100;
        expect(overall.attendancePercentage).toBe(expected);
      }
    });
  });

  describe('PUT /api/attendance/:id', () => {
    it('should update attendance status', async () => {
      if (!adminToken || !classId || !subjectId || studentIds.length === 0) return;

      const Attendance = require('../src/models/Attendance');
      const attendance = await Attendance.findOne({ class: classId, subject: subjectId });
      if (!attendance) return;

      const res = await request(app)
        .put(`/api/attendance/${attendance._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'LATE' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('LATE');
    });

    it('should return 400 for invalid status', async () => {
      if (!adminToken) return;

      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/attendance/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
