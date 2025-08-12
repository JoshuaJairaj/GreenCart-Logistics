const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Driver = require('../src/models/Driver');
const Route = require('../src/models/Route');
const Order = require('../src/models/Order');

describe('Simulation API', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/greencart_test';
    await mongoose.connect(MONGODB_TEST_URI);

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'test123',
      role: 'manager'
    });
    await testUser.save();

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'test123'
      });

    authToken = loginResponse.body.token;

    // Create test data
    await Driver.create({
      name: 'Test Driver',
      shiftHours: 8,
      pastWeekHours: [8, 8, 8, 8, 8, 0, 0]
    });

    await Route.create({
      routeId: 1,
      distanceKm: 10,
      trafficLevel: 'Low',
      baseTimeMin: 30
    });

    await Order.create({
      orderId: 1,
      valueRs: 1500,
      routeId: 1,
      deliveryTime: '10:00'
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/simulation/run', () => {
    it('should run simulation successfully with valid inputs', async () => {
      const response = await request(app)
        .post('/api/simulation/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          availableDrivers: 1,
          startTime: '09:00',
          maxHoursPerDay: 8
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveProperty('totalProfit');
      expect(response.body.results).toHaveProperty('efficiencyScore');
      expect(response.body.results).toHaveProperty('onTimeDeliveries');
      expect(response.body.results).toHaveProperty('lateDeliveries');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/simulation/run')
        .send({
          availableDrivers: 1,
          startTime: '09:00',
          maxHoursPerDay: 8
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 with invalid inputs', async () => {
      const response = await request(app)
        .post('/api/simulation/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          availableDrivers: 0, // Invalid
          startTime: '25:00', // Invalid
          maxHoursPerDay: 30 // Invalid
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 with missing required fields', async () => {
      const response = await request(app)
        .post('/api/simulation/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          availableDrivers: 1
          // Missing startTime and maxHoursPerDay
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/simulation/history', () => {
    it('should return simulation history', async () => {
      const response = await request(app)
        .get('/api/simulation/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('simulations');
      expect(response.body).toHaveProperty('pagination');
    });
  });
});
