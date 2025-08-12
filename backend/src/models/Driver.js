const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  shiftHours: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  pastWeekHours: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 7;
      },
      message: 'Past week hours must contain exactly 7 days of data'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Driver', driverSchema);
