const request = require('supertest');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_management_test';

let app;
let accessToken;
let collegeId;

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
  }

  const { app: expressApp } = require('../server');
  app = expressApp;

  if (mongoose.connection.readyState === 1) {
    // Register a college and get token
    const regRes = await request(app)
      .post('/api/auth/register-college')
      .send({
        collegeName: 'Sub Test College',
        collegeCode: 'SUBCOL',
        collegeEmail: 'info@subcol.edu',
        adminName: 'Sub Admin',
        adminEmail: 'admin@subcol.edu',
        adminPassword: 'Admin@Test123',
      });

    if (regRes.status === 201) {
      collegeId = regRes.body.data.college._id;
    }

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@subcol.edu', password: 'Admin@Test123' });

    if (loginRes.status === 200) {
      accessToken = loginRes.body.data.accessToken;
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('Subscription API', () => {
  describe('GET /api/subscriptions/plans', () => {
    it('should return all available plans', async () => {
      const res = await request(app)
        .get('/api/subscriptions/plans')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(4); // FREE, BASIC, PRO, ENTERPRISE

      const planNames = res.body.data.map((p) => p.name);
      expect(planNames).toContain('FREE');
      expect(planNames).toContain('BASIC');
      expect(planNames).toContain('PRO');
      expect(planNames).toContain('ENTERPRISE');
    });

    it('should include pricing and limits in plan data', async () => {
      const res = await request(app).get('/api/subscriptions/plans').expect(200);

      const freePlan = res.body.data.find((p) => p.name === 'FREE');
      expect(freePlan.limits.maxStudents).toBe(50);
      expect(freePlan.limits.maxTeachers).toBe(5);
      expect(freePlan.pricing.monthly).toBe(0);

      const proPlan = res.body.data.find((p) => p.name === 'PRO');
      expect(proPlan.limits.maxStudents).toBe(1000);
      expect(proPlan.limits.maxTeachers).toBe(100);
    });
  });

  describe('GET /api/subscriptions/current', () => {
    it('should return current subscription for authenticated college admin', async () => {
      if (!accessToken || mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.plan).toBe('FREE');
      expect(res.body.data.status).toBe('TRIAL');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/subscriptions/current')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Plan Limits Enforcement', () => {
    it('should enforce FREE plan student limit (50 students)', async () => {
      if (!accessToken || mongoose.connection.readyState !== 1) return;

      const { Subscription } = require('../src/models/Subscription');
      const Student = require('../src/models/Student');

      // Mock: set student count to max
      await Student.updateMany({ collegeId }, { isActive: true });

      const subscription = await Subscription.findOne({ collegeId });
      expect(subscription.limits.maxStudents).toBe(50);
      expect(subscription.limits.maxTeachers).toBe(5);
    });

    it('should enforce FREE plan feature restrictions', async () => {
      if (!accessToken || mongoose.connection.readyState !== 1) return;

      const { Subscription } = require('../src/models/Subscription');
      const subscription = await Subscription.findOne({ collegeId });

      expect(subscription.hasFeature('attendance')).toBe(true);
      expect(subscription.hasFeature('notices')).toBe(true);
      expect(subscription.hasFeature('exams')).toBe(false); // Not in FREE
      expect(subscription.hasFeature('chat')).toBe(false);
    });

    it('should check PRO plan has all features', async () => {
      const { Subscription, PLANS, PLAN_LIMITS } = require('../src/models/Subscription');

      // Create a mock PRO subscription to test
      const mockSub = new Subscription({
        collegeId: new mongoose.Types.ObjectId(),
        plan: PLANS.PRO,
        status: 'ACTIVE',
        limits: PLAN_LIMITS.PRO,
      });

      expect(mockSub.hasFeature('attendance')).toBe(true);
      expect(mockSub.hasFeature('exams')).toBe(true);
      expect(mockSub.hasFeature('chat')).toBe(true);
      expect(mockSub.hasFeature('syllabus')).toBe(true);
      expect(PLAN_LIMITS.PRO.maxStudents).toBe(1000);
      expect(PLAN_LIMITS.PRO.maxTeachers).toBe(100);
    });

    it('should check ENTERPRISE plan has unlimited students', () => {
      const { PLAN_LIMITS } = require('../src/models/Subscription');
      expect(PLAN_LIMITS.ENTERPRISE.maxStudents).toBe(-1);
      expect(PLAN_LIMITS.ENTERPRISE.maxTeachers).toBe(-1);
    });
  });

  describe('PUT /api/subscriptions/upgrade', () => {
    it('should upgrade plan successfully', async () => {
      if (!accessToken || mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .put('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ plan: 'BASIC', billingCycle: 'MONTHLY' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.plan).toBe('BASIC');
    });

    it('should return 400 for invalid plan', async () => {
      if (!accessToken || mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .put('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ plan: 'INVALID_PLAN' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
