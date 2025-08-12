const { validationResult } = require('express-validator');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Order = require('../models/Order');
const Simulation = require('../models/Simulation');

class SimulationEngine {
  constructor() {
    this.LATE_PENALTY = 50;
    this.FATIGUE_SPEED_REDUCTION = 0.3;
    this.HIGH_VALUE_THRESHOLD = 1000;
    this.HIGH_VALUE_BONUS = 0.1;
    this.BASE_FUEL_COST_PER_KM = 5;
    this.HIGH_TRAFFIC_SURCHARGE = 2;
  }

  calculateDriverFatigue(driver) {
    const totalHours = driver.pastWeekHours.reduce((sum, hours) => sum + hours, 0);
    const avgHoursPerDay = totalHours / 7;
    return avgHoursPerDay > 8 ? this.FATIGUE_SPEED_REDUCTION : 0;
  }

  calculateDeliveryTime(route, fatigueReduction = 0) {
    let adjustedTime = route.baseTimeMin;
    if (fatigueReduction > 0) {
      adjustedTime *= (1 + fatigueReduction);
    }
    return Math.ceil(adjustedTime);
  }

  calculateFuelCost(route) {
    const baseCost = route.distanceKm * this.BASE_FUEL_COST_PER_KM;
    const surcharge = route.trafficLevel === 'High' ? 
      route.distanceKm * this.HIGH_TRAFFIC_SURCHARGE : 0;
    return { baseCost, surcharge, total: baseCost + surcharge };
  }

  async runSimulation(inputs) {
    const { availableDrivers, startTime, maxHoursPerDay } = inputs;

    const drivers = await Driver.find({ isActive: true }).limit(availableDrivers);
    const orders = await Order.find({ status: 'pending' });
    const routes = await Route.find();

    if (drivers.length === 0) {
      throw new Error('No available drivers found');
    }

    const routeMap = new Map();
    routes.forEach(route => routeMap.set(route.routeId, route));

    const results = {
      deliveryStats: [],
      fuelCostBreakdown: { baseCost: 0, trafficSurcharge: 0, totalCost: 0 },
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      totalProfit: 0
    };

    for (const order of orders) {
      const route = routeMap.get(order.routeId);
      if (!route) continue;

      const fuelCost = this.calculateFuelCost(route);
      const deliveryTime = this.calculateDeliveryTime(route);
      const isOnTime = Math.random() > 0.3; // Simplified logic
      
      const penalty = !isOnTime ? this.LATE_PENALTY : 0;
      const bonus = (order.valueRs > this.HIGH_VALUE_THRESHOLD && isOnTime) ? 
        order.valueRs * this.HIGH_VALUE_BONUS : 0;

      const orderProfit = order.valueRs + bonus - penalty - fuelCost.total;

      results.deliveryStats.push({
        orderId: order.orderId,
        isOnTime,
        profit: orderProfit,
        penalty,
        bonus
      });

      results.fuelCostBreakdown.baseCost += fuelCost.baseCost;
      results.fuelCostBreakdown.trafficSurcharge += fuelCost.surcharge;
      results.fuelCostBreakdown.totalCost += fuelCost.total;

      if (isOnTime) {
        results.onTimeDeliveries++;
      } else {
        results.lateDeliveries++;
      }

      results.totalProfit += orderProfit;
    }

    const totalDeliveries = results.onTimeDeliveries + results.lateDeliveries;
    results.efficiencyScore = totalDeliveries > 0 ? 
      (results.onTimeDeliveries / totalDeliveries) * 100 : 0;

    return results;
  }
}

exports.runSimulation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const inputs = req.body;
    const engine = new SimulationEngine();
    const results = await engine.runSimulation(inputs);

    const simulation = new Simulation({
      inputs,
      results,
      createdBy: req.userId
    });
    await simulation.save();

    res.json({
      message: 'Simulation completed successfully',
      simulationId: simulation._id,
      results
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ 
      error: 'Simulation failed', 
      details: error.message 
    });
  }
};

exports.getSimulationHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const simulations = await Simulation.find({ createdBy: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username');

    const total = await Simulation.countDocuments({ createdBy: req.userId });

    res.json({
      simulations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch simulation history' });
  }
};

exports.getSimulationById = async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    res.json({ simulation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
};
