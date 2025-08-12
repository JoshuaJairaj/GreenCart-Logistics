const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

const orderValidation = [
  body('orderId')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a positive integer'),
  body('valueRs')
    .isFloat({ min: 0 })
    .withMessage('Order value must be greater than or equal to 0'),
  body('routeId')
    .isInt({ min: 1 })
    .withMessage('Route ID must be a positive integer'),
  body('deliveryTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Delivery time must be in HH:MM format')
];

router.use(auth); // All order routes require authentication

router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderValidation, handleValidationErrors, orderController.createOrder);
router.put('/:id', orderValidation, handleValidationErrors, orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
