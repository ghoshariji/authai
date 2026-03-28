const request = require('supertest');
const mongoose = require('mongoose');

// Use in-memory or test DB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_management_test';

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = MONGO_URI;
  process.env.JWT_SECRET = 'test_jwt_secret_for_testing';
  process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_for_testing';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

  // Attempt to connect
  try {
    await mongoose.connect(MONGO_URI);
  } catch (err) {
    // Skip if no DB available
    console.warn('MongoDB not available for tests:', err.message);
  }

  const { app: expressApp } = require('../server');
  app = expressApp;
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('Auth API', () => {
  const testCollegeData = {
    collegeName: 'Test University',
    collegeCode: 'TESTUNI',
    collegeEmail: 'info@testuni.edu',
    collegePhone: '+1-555-9999',
    adminName: 'Test Admin',
    adminEmail: 'admin@testuni.edu',
    adminPassword: 'Admin@Test123',
  };

  let accessToken;
  let refreshToken;

  describe('POST /api/auth/register-college', () => {
    it('should register a new college successfully', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.warn('Skipping test: DB not connected');
        return;
      }

      const res = await request(app)
        .post('/api/auth/register-college')
        .send(testCollegeData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.college.name).toBe('Test University');
      expect(res.body.data.college.code).toBe('TESTUNI');
      expect(res.body.data.adminUser.email).toBe('admin@testuni.edu');
      expect(res.body.data.adminUser.role).toBe('COLLEGE_ADMIN');
      expect(res.body.data.subscription.plan).toBe('FREE');
    });

    it('should return 422 for invalid data (missing required fields)', async () => {
      const res = await request(app)
        .post('/api/auth/register-college')
        .send({ collegeName: 'Incomplete' })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 409 for duplicate college code', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post('/api/auth/register-college')
        .send({ ...testCollegeData, adminEmail: 'another@testuni.edu' })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should return 422 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register-college')
        .send({ ...testCollegeData, adminPassword: 'weak', collegeCode: 'NEW123' })
        .expect(422);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@testuni.edu', password: 'Admin@Test123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@testuni.edu');
      expect(res.body.data.user.role).toBe('COLLEGE_ADMIN');

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@testuni.edu', password: 'WrongPassword@123' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 422 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Password@123' })
        .expect(422);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should return new tokens with valid refresh token', async () => {
      if (!refreshToken || mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should return 422 when refresh token is missing', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(422);

      expect(res.body.success).toBe(false);
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      if (!accessToken || mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@testuni.edu');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      if (!accessToken || mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success even for non-existent email (security)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 422 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-valid' })
        .expect(422);

      expect(res.body.success).toBe(false);
    });
  });
});
