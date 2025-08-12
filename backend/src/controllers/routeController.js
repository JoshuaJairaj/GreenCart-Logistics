const { validationResult } = require('express-validator');
const Route = require('../models/Route');

exports.getAllRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const routes = await Route.find()
      .sort({ routeId: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Route.countDocuments();

    res.json({
      routes,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get routes', message: error.message });
  }
};

exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json({ route });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get route', message: error.message });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const route = new Route(req.body);
    await route.save();

    res.status(201).json({
      message: 'Route created successfully',
      route
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Route with this ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create route', message: error.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({
      message: 'Route updated successfully',
      route
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update route', message: error.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete route', message: error.message });
  }
};
