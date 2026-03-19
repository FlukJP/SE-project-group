import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ReviewService } from '../services/review.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const ReviewController = {
    // 1.Create Review
    create: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);
            const { orderId, rating, comment } = req.body;
            const review = await ReviewService.create(req.user.userID, { orderId, rating, comment });
            res.status(201).json({ success: true, data: review });
        } catch (error) {
            next(error);
        }
    },

    // 2.Get My Reviews
    getMyReviews: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);
            const reviews = await ReviewService.getMyReviews(req.user.userID);
            res.status(200).json({ success: true, data: reviews });
        } catch (error) {
            next(error);
        }
    },

    // 3.Get Reviews for Seller
    getReviewsForSeller: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const sellerId = Number(req.params.sellerId);
            if (!sellerId || sellerId <= 0) throw new AppError('Invalid seller ID', 400);
            const reviews = await ReviewService.getReviewsForSeller(sellerId);
            res.status(200).json({ success: true, data: reviews });
        } catch (error) {
            next(error);
        }
    },

    // 4.Get Seller Rating
    getSellerRating: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const sellerId = Number(req.params.sellerId);
            if (!sellerId || sellerId <= 0) throw new AppError('Invalid seller ID', 400);
            const rating = await ReviewService.getSellerRating(sellerId);
            res.status(200).json({ success: true, data: rating });
        } catch (error) {
            next(error);
        }
    },

    // 5.Check if Reviewed
    checkReviewed: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);
            const orderId = Number(req.params.orderId);
            if (!orderId || orderId <= 0) throw new AppError('Invalid order ID', 400);
            const result = await ReviewService.checkReviewed(orderId, req.user.userID);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    },
};
