import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewService } from '@/src/services/review.service';
import { ReviewModel } from '@/src/models/reviewModel';
import { OrderModel } from '@/src/models/orderModel';
import type { Order } from '@/src/types/Order';

vi.mock('@/src/models/reviewModel');
vi.mock('@/src/models/orderModel');
vi.mock('@/src/lib/mysql', () => ({
    default: {
        query: vi.fn(async () => [{ affectedRows: 1 }]),
    },
}));

const sampleOrder: Order = {
    Order_ID: 1,
    Product_ID: 10,
    Buyer_ID: 20,
    Seller_ID: 30,
    Quantity: 1,
    Total_Price: 500,
    Status: 'completed',
};

const sampleReview = {
    Review_ID: 1,
    Order_ID: 1,
    Reviewer_ID: 20,
    Seller_ID: 30,
    Rating: 5,
    Comment: 'Great!',
    Created_at: '2024-01-01T00:00:00.000Z',
};

describe('ReviewService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // ===== create =====
    describe('create', () => {
        it('should throw when orderId or rating is missing', async () => {
            await expect(ReviewService.create(20, { orderId: 0, rating: 5 })).rejects.toThrow('orderId and rating are required');
            await expect(ReviewService.create(20, { orderId: 1, rating: 0 })).rejects.toThrow('orderId and rating are required');
        });

        it('should throw when rating is out of range', async () => {
            await expect(ReviewService.create(20, { orderId: 1, rating: 0 })).rejects.toThrow('orderId and rating are required');
            await expect(ReviewService.create(20, { orderId: 1, rating: 6 })).rejects.toThrow('Rating must be between 1 and 5');
            await expect(ReviewService.create(20, { orderId: 1, rating: -1 })).rejects.toThrow('Rating must be between 1 and 5');
        });

        it('should throw when order not found', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(null);

            await expect(ReviewService.create(20, { orderId: 999, rating: 5 })).rejects.toThrow('Order not found');
        });

        it('should throw when reviewer is not the buyer', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);

            await expect(ReviewService.create(999, { orderId: 1, rating: 5 })).rejects.toThrow('Only the buyer can review this order');
        });

        it('should throw when order is not completed', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue({ ...sampleOrder, Status: 'pending' });

            await expect(ReviewService.create(20, { orderId: 1, rating: 5 })).rejects.toThrow('Can only review completed orders');
        });

        it('should throw when order already reviewed', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            vi.mocked(ReviewModel.findByOrderId).mockResolvedValue(sampleReview);

            await expect(ReviewService.create(20, { orderId: 1, rating: 5 })).rejects.toThrow('This order has already been reviewed');
        });

        it('should create review successfully', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            vi.mocked(ReviewModel.findByOrderId).mockResolvedValue(null);
            vi.mocked(ReviewModel.create).mockResolvedValue(1);
            vi.mocked(ReviewModel.getSellerRating).mockResolvedValue({ averageRating: 5, totalReviews: 1 });
            vi.mocked(ReviewModel.findById).mockResolvedValue(sampleReview);

            const result = await ReviewService.create(20, { orderId: 1, rating: 5, comment: 'Great!' });
            expect(result).toEqual(sampleReview);
            expect(ReviewModel.create).toHaveBeenCalledTimes(1);
        });

        it('should create review without comment', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            vi.mocked(ReviewModel.findByOrderId).mockResolvedValue(null);
            vi.mocked(ReviewModel.create).mockResolvedValue(1);
            vi.mocked(ReviewModel.getSellerRating).mockResolvedValue({ averageRating: 4.5, totalReviews: 2 });
            vi.mocked(ReviewModel.findById).mockResolvedValue({ ...sampleReview, Comment: null });

            const result = await ReviewService.create(20, { orderId: 1, rating: 4 });
            expect(result).toBeDefined();
        });
    });

    // ===== getMyReviews =====
    describe('getMyReviews', () => {
        it('should return reviews written by user', async () => {
            vi.mocked(ReviewModel.findByReviewerId).mockResolvedValue([sampleReview]);

            const result = await ReviewService.getMyReviews(20);
            expect(result).toHaveLength(1);
            expect(ReviewModel.findByReviewerId).toHaveBeenCalledWith(20);
        });

        it('should return empty array when no reviews', async () => {
            vi.mocked(ReviewModel.findByReviewerId).mockResolvedValue([]);

            const result = await ReviewService.getMyReviews(99);
            expect(result).toEqual([]);
        });
    });

    // ===== getReviewsForSeller =====
    describe('getReviewsForSeller', () => {
        it('should return reviews for seller', async () => {
            vi.mocked(ReviewModel.findBySellerId).mockResolvedValue([sampleReview]);

            const result = await ReviewService.getReviewsForSeller(30);
            expect(result).toHaveLength(1);
            expect(ReviewModel.findBySellerId).toHaveBeenCalledWith(30);
        });
    });

    // ===== getSellerRating =====
    describe('getSellerRating', () => {
        it('should return seller rating stats', async () => {
            vi.mocked(ReviewModel.getSellerRating).mockResolvedValue({ averageRating: 4.2, totalReviews: 10 });

            const result = await ReviewService.getSellerRating(30);
            expect(result.averageRating).toBe(4.2);
            expect(result.totalReviews).toBe(10);
        });
    });

    // ===== checkReviewed =====
    describe('checkReviewed', () => {
        it('should throw when order not found', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(null);

            await expect(ReviewService.checkReviewed(999, 20)).rejects.toThrow('Order not found');
        });

        it('should throw 403 when user is unrelated to order', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);

            await expect(ReviewService.checkReviewed(1, 999)).rejects.toThrow('Unauthorized to check this order');
        });

        it('should return reviewed: true when review exists (buyer)', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            vi.mocked(ReviewModel.findByOrderId).mockResolvedValue(sampleReview);

            const result = await ReviewService.checkReviewed(1, 20);
            expect(result).toEqual({ reviewed: true });
        });

        it('should return reviewed: false when no review exists (seller)', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            vi.mocked(ReviewModel.findByOrderId).mockResolvedValue(null);

            const result = await ReviewService.checkReviewed(1, 30);
            expect(result).toEqual({ reviewed: false });
        });
    });
});
