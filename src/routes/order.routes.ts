import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJWT, requireVerified } from '../middleware/auth.middleware';
import {
    validateBody,
    validateParams,
    createOrderSchema,
    updateOrderStatusSchema,
    orderIdParam,
} from '../middleware/validate.middleware';

const router = Router();

router.get('/buyer/my', authenticateJWT, OrderController.getMyBuyerOrders);
router.get('/seller/my', authenticateJWT, OrderController.getMySellerOrders);
router.get('/:orderId', authenticateJWT, validateParams(orderIdParam), OrderController.getByID);

router.post('/', authenticateJWT, requireVerified, validateBody(createOrderSchema), OrderController.create);
router.patch('/:orderId/status', authenticateJWT, requireVerified, validateParams(orderIdParam), validateBody(updateOrderStatusSchema), OrderController.updateStatus);
router.patch('/:orderId/cancel', authenticateJWT, requireVerified, validateParams(orderIdParam), OrderController.cancel);

export default router;
