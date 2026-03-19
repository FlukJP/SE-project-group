import { ReviewModel } from '../models/reviewModel';
import { OrderModel } from '../models/orderModel';
import { AppError } from '../errors/AppError';
import db from '@/src/lib/mysql';
import { ResultSetHeader } from 'mysql2';

export const ReviewService = {
    // 1.Create reviews and update seller rating scores.
    create: async (reviewerId: number, data: { orderId: number; rating: number; comment?: string }) => {
        if (!data.orderId || !data.rating) throw new AppError('orderId and rating are required', 400);
        if (data.rating < 1 || data.rating > 5) throw new AppError('Rating must be between 1 and 5', 400);

        const order = await OrderModel.findByID(data.orderId);
        if (!order) throw new AppError('Order not found', 404);

        if (order.Buyer_ID !== reviewerId) throw new AppError('Only the buyer can review this order', 403);

        if (order.Status !== 'completed') throw new AppError('Can only review completed orders', 400);

        const existing = await ReviewModel.findByOrderId(data.orderId);
        if (existing) throw new AppError('This order has already been reviewed', 409);

        const reviewId = await ReviewModel.create({
            orderId: data.orderId,
            reviewerId,
            sellerId: order.Seller_ID,
            rating: data.rating,
            comment: data.comment,
        });

        const sellerRating = await ReviewModel.getSellerRating(order.Seller_ID);
        const updateSql = `UPDATE User SET RatingScore = ? WHERE User_ID = ?`;
        await db.query<ResultSetHeader>(updateSql, [sellerRating.averageRating, order.Seller_ID]);

        return ReviewModel.findById(reviewId);
    },

    // 2.Get reviews written by the user
    getMyReviews: async (userId: number) => {
        return ReviewModel.findByReviewerId(userId);
    },

    // 3.Get reviews for a seller
    getReviewsForSeller: async (sellerId: number) => {
        return ReviewModel.findBySellerId(sellerId);
    },

    // 4.Get seller's overall rating
    getSellerRating: async (sellerId: number) => {
        return ReviewModel.getSellerRating(sellerId);
    },

    // 5.Check if the order has been reviewed (also checks ownership)
    checkReviewed: async (orderId: number, userId: number) => {
        const order = await OrderModel.findByID(orderId);
        if (!order) throw new AppError('Order not found', 404);
        if (order.Buyer_ID !== userId && order.Seller_ID !== userId) {
            throw new AppError('Unauthorized to check this order', 403);
        }
        const review = await ReviewModel.findByOrderId(orderId);
        return { reviewed: !!review };
    },
};
