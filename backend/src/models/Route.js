const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: {
    type: Number,
    required: true,
    unique: true
  },
  distanceKm: {
    type: Number,
    required: true,
    min: 0
  },
  trafficLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High']
  },
  baseTimeMin: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
