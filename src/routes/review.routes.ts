import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticateJWT, requireVerified } from '../middleware/auth.middleware';
import {
    validateBody,
    validateParams,
    createReviewSchema,
    sellerIdParam,
    orderIdParam,
} from '../middleware/validate.middleware';

const router = Router();

router.get('/seller/:sellerId', validateParams(sellerIdParam), ReviewController.getReviewsForSeller);
router.get('/seller/:sellerId/rating', validateParams(sellerIdParam), ReviewController.getSellerRating);

router.get('/my', authenticateJWT, ReviewController.getMyReviews);
router.get('/check/:orderId', authenticateJWT, validateParams(orderIdParam), ReviewController.checkReviewed);
router.post('/', authenticateJWT, requireVerified, validateBody(createReviewSchema), ReviewController.create);

export default router;
