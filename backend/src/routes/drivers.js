const express = require('express');
const { body } = require('express-validator');
const driverController = require('../controllers/driverController');
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

const driverValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('shiftHours')
    .isFloat({ min: 0, max: 24 })
    .withMessage('Shift hours must be between 0 and 24'),
  body('pastWeekHours')
    .isArray({ min: 7, max: 7 })
    .withMessage('Past week hours must be an array of 7 values'),
  body('pastWeekHours.*')
    .isFloat({ min: 0, max: 24 })
    .withMessage('Each day hours must be between 0 and 24')
];

router.use(auth); // All driver routes require authentication

router.get('/', driverController.getAllDrivers);
router.get('/:id', driverController.getDriverById);
router.post('/', driverValidation, handleValidationErrors, driverController.createDriver);
router.put('/:id', driverValidation, handleValidationErrors, driverController.updateDriver);
router.delete('/:id', driverController.deleteDriver);

module.exports = router;
