const express = require('express');
const { body } = require('express-validator');
const routeController = require('../controllers/routeController');
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

const routeValidation = [
  body('routeId')
    .isInt({ min: 1 })
    .withMessage('Route ID must be a positive integer'),
  body('distanceKm')
    .isFloat({ min: 0.1 })
    .withMessage('Distance must be greater than 0'),
  body('trafficLevel')
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Traffic level must be Low, Medium, or High'),
  body('baseTimeMin')
    .isInt({ min: 1 })
    .withMessage('Base time must be at least 1 minute')
];

router.use(auth); // All route endpoints require authentication

router.get('/', routeController.getAllRoutes);
router.get('/:id', routeController.getRouteById);
router.post('/', routeValidation, handleValidationErrors, routeController.createRoute);
router.put('/:id', routeValidation, handleValidationErrors, routeController.updateRoute);
router.delete('/:id', routeController.deleteRoute);

module.exports = router;
