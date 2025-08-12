const express = require('express');
const { body } = require('express-validator');
const simulationController = require('../controllers/simulationController');
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

const simulationValidation = [
  body('availableDrivers')
    .isInt({ min: 1 })
    .withMessage('Available drivers must be a positive integer'),
  body('startTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:MM format'),
  body('maxHoursPerDay')
    .isFloat({ min: 1, max: 24 })
    .withMessage('Max hours per day must be between 1 and 24')
];

router.use(auth); // All simulation routes require authentication

router.post('/run', simulationValidation, handleValidationErrors, simulationController.runSimulation);
router.get('/history', simulationController.getSimulationHistory);
router.get('/:id', simulationController.getSimulationById);

module.exports = router;

