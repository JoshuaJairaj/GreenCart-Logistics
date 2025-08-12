const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: Number,
    required: true,
    unique: true
  },
  valueRs: {
    type: Number,
    required: true,
    min: 0
  },
  routeId: {
    type: Number,
    required: true,
    ref: 'Route'
  },
  deliveryTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
