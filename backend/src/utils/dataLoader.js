const mongoose = require('mongoose');
require('dotenv').config();

const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Order = require('../models/Order');
const User = require('../models/User');

// Fix the pastWeekHours arrays to have exactly 7 values
const driversData = [
  { name: 'Amit', shiftHours: 6, pastWeekHours: [8, 7, 7, 6, 10, 8, 7] },
  { name: 'Priya', shiftHours: 6, pastWeekHours: [10, 9, 6, 6, 7, 7, 8] },
  { name: 'Rohit', shiftHours: 10, pastWeekHours: [10, 6, 10, 7, 10, 9, 7] },
  { name: 'Neha', shiftHours: 9, pastWeekHours: [10, 8, 6, 7, 9, 8, 8] },
  { name: 'Karan', shiftHours: 7, pastWeekHours: [7, 8, 6, 9, 6, 8, 7] },
  { name: 'Sneha', shiftHours: 8, pastWeekHours: [10, 8, 6, 9, 10, 6, 9] },
  { name: 'Vikram', shiftHours: 6, pastWeekHours: [10, 8, 10, 8, 10, 7, 6] },
  { name: 'Anjali', shiftHours: 6, pastWeekHours: [7, 8, 6, 7, 6, 9, 8] },
  { name: 'Manoj', shiftHours: 9, pastWeekHours: [8, 7, 8, 8, 7, 8, 6] },
  { name: 'Pooja', shiftHours: 10, pastWeekHours: [7, 10, 7, 7, 9, 9, 8] }
];

const routesData = [
  { routeId: 1, distanceKm: 25, trafficLevel: 'High', baseTimeMin: 125 },
  { routeId: 2, distanceKm: 12, trafficLevel: 'High', baseTimeMin: 48 },
  { routeId: 3, distanceKm: 6, trafficLevel: 'Low', baseTimeMin: 18 },
  { routeId: 4, distanceKm: 15, trafficLevel: 'Medium', baseTimeMin: 60 },
  { routeId: 5, distanceKm: 7, trafficLevel: 'Low', baseTimeMin: 35 },
  { routeId: 6, distanceKm: 15, trafficLevel: 'Low', baseTimeMin: 75 },
  { routeId: 7, distanceKm: 20, trafficLevel: 'Medium', baseTimeMin: 100 },
  { routeId: 8, distanceKm: 19, trafficLevel: 'Low', baseTimeMin: 76 },
  { routeId: 9, distanceKm: 9, trafficLevel: 'Low', baseTimeMin: 45 },
  { routeId: 10, distanceKm: 22, trafficLevel: 'High', baseTimeMin: 88 }
];

const ordersData = [
  { orderId: 1, valueRs: 2594, routeId: 7, deliveryTime: '02:07' },
  { orderId: 2, valueRs: 1835, routeId: 6, deliveryTime: '01:19' },
  { orderId: 3, valueRs: 766, routeId: 9, deliveryTime: '01:06' },
  { orderId: 4, valueRs: 572, routeId: 1, deliveryTime: '02:02' },
  { orderId: 5, valueRs: 826, routeId: 3, deliveryTime: '00:35' },
  { orderId: 6, valueRs: 2642, routeId: 2, deliveryTime: '01:02' },
  { orderId: 7, valueRs: 1763, routeId: 10, deliveryTime: '01:47' },
  { orderId: 8, valueRs: 2367, routeId: 5, deliveryTime: '01:00' },
  { orderId: 9, valueRs: 247, routeId: 2, deliveryTime: '01:12' },
  { orderId: 10, valueRs: 1292, routeId: 6, deliveryTime: '01:12' },
  { orderId: 11, valueRs: 1402, routeId: 7, deliveryTime: '01:40' },
  { orderId: 12, valueRs: 2058, routeId: 1, deliveryTime: '02:11' },
  { orderId: 13, valueRs: 2250, routeId: 3, deliveryTime: '00:40' },
  { orderId: 14, valueRs: 635, routeId: 5, deliveryTime: '01:05' },
  { orderId: 15, valueRs: 2279, routeId: 10, deliveryTime: '01:30' }
];

async function loadData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('Database:', process.env.MONGODB_URI?.split('@')[1]?.split('?')[0]);
    
    // Add connection options for better error handling
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ Connected to MongoDB');

    // Test connection with a ping
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database ping successful');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Driver.deleteMany({}),
      Route.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}) // Clear users for fresh start
    ]);
    console.log('✅ Cleared existing data');

    // Load drivers
    console.log('👥 Loading drivers...');
    const drivers = await Driver.insertMany(driversData);
    console.log(`✅ Loaded ${drivers.length} drivers`);

    // Load routes
    console.log('🛣️  Loading routes...');
    const routes = await Route.insertMany(routesData);
    console.log(`✅ Loaded ${routes.length} routes`);

    // Load orders
    console.log('📦 Loading orders...');
    const orders = await Order.insertMany(ordersData);
    console.log(`✅ Loaded ${orders.length} orders`);

    // Create default users with updated User model
    console.log('👤 Creating default users...');
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@greencart.com',
      password: 'admin123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('✅ Created admin user');

    const managerUser = new User({
      username: 'manager',
      email: 'manager@greencart.com',
      password: 'manager123',
      role: 'manager'
    });
    await managerUser.save();
    console.log('✅ Created manager user');

    console.log('\n🎉 Data loading completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Manager: manager / manager123');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error loading data:');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    
    if (error.code === 8000) {
      console.error('\n🔧 MongoDB Atlas Authentication Failed');
      console.error('Check these items:');
      console.error('1. Username and password are correct');
      console.error('2. User has proper database permissions');
      console.error('3. Your IP is whitelisted in Network Access');
      console.error('4. Connection string includes database name');
    }
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  loadData();
}

module.exports = { loadData };
