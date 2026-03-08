import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJWT, requireVerified } from '../middleware/auth.middleware';

const router = Router();

router.get('/buyer/my', authenticateJWT, OrderController.getMyBuyerOrders);
router.get('/seller/my', authenticateJWT, OrderController.getMySellerOrders);
router.get('/:orderId', authenticateJWT, OrderController.getByID);

router.post('/', authenticateJWT, requireVerified, OrderController.create);
router.patch('/:orderId/status', authenticateJWT, requireVerified, OrderController.updateStatus);
router.patch('/:orderId/cancel', authenticateJWT, requireVerified, OrderController.cancel);

export default router;
