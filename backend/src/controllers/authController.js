const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

exports.register = async (req, res) => {
  try {
    // Manual input validation
    const { username, email, password, role = 'manager' } = req.body;
    
    // Check for missing required fields
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ 
        error: 'Username is required and must be a string' 
      });
    }
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ 
        error: 'Email is required and must be a string' 
      });
    }
    
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ 
        error: 'Password is required and must be a string' 
      });
    }
    
    // Validate username format
    if (username.length < 3) {
      return res.status(400).json({ 
        error: 'Username must be at least 3 characters long' 
      });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        error: 'Username can only contain letters, numbers, and underscores' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }
    
    // Validate role
    if (role && !['manager', 'admin'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be either manager or admin' 
      });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists with this email or username' 
      });
    }

    const user = new User({ username, email, password, role });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Manual input validation
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ 
        error: 'Password is required and must be a string' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Ensure at least one identifier is provided
    if (!username && !email) {
      return res.status(400).json({ 
        error: 'Either username or email is required' 
      });
    }

    // Validate username if provided
    if (username && typeof username !== 'string') {
      return res.status(400).json({ 
        error: 'Username must be a string' 
      });
    }

    if (username && username.length < 3) {
      return res.status(400).json({ 
        error: 'Username must be at least 3 characters long' 
      });
    }

    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        error: 'Username can only contain letters, numbers, and underscores' 
      });
    }

    // Validate email if provided
    if (email && typeof email !== 'string') {
      return res.status(400).json({ 
        error: 'Email must be a string' 
      });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Please provide a valid email address' 
        });
      }
    }

    // Allow login with either username or email
    const user = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile', message: error.message });
  }
};
