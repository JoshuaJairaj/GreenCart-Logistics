const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  inputs: {
    availableDrivers: {
      type: Number,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    maxHoursPerDay: {
      type: Number,
      required: true
    }
  },
  results: {
    totalProfit: Number,
    efficiencyScore: Number,
    onTimeDeliveries: Number,
    lateDeliveries: Number,
    fuelCostBreakdown: {
      baseCost: Number,
      trafficSurcharge: Number,
      totalCost: Number
    },
    deliveryStats: [{
      orderId: Number,
      isOnTime: Boolean,
      profit: Number,
      penalty: Number,
      bonus: Number
    }]
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Simulation', simulationSchema);
