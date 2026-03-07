import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticateJWT, requireVerified } from '../middleware/auth.middleware';

const router = Router();

router.get('/seller/:sellerId', ReviewController.getReviewsForSeller);
router.get('/seller/:sellerId/rating', ReviewController.getSellerRating);

router.get('/my', authenticateJWT, ReviewController.getMyReviews);
router.get('/check/:orderId', authenticateJWT, ReviewController.checkReviewed);
router.post('/', authenticateJWT, requireVerified, ReviewController.create);

export default router;
