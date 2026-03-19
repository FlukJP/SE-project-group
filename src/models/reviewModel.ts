import db from '@/src/lib/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ReviewRow, SellerRating } from '@/src/types/Review';

export const ReviewModel = {
    // 1.Create a new review
    create: async (data: { orderId: number; reviewerId: number; sellerId: number; rating: number; comment?: string }): Promise<number> => {
        const sql = `INSERT INTO Review (Order_ID, Reviewer_ID, Seller_ID, Rating, Comment) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query<ResultSetHeader>(sql, [
            data.orderId,
            data.reviewerId,
            data.sellerId,
            data.rating,
            data.comment || null,
        ]);
        return result.insertId;
    },

    // 2.Get review by ID
    findById: async (id: number): Promise<ReviewRow | null> => {
        const sql = `SELECT * FROM Review WHERE Review_ID = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as ReviewRow) : null;
    },

    // 3.Get reviews by Reviewer ID (My Reviews)
    findByReviewerId: async (reviewerId: number): Promise<ReviewRow[]> => {
        const sql = `
            SELECT r.*, u.Username AS ReviewerName, p.Title AS ProductTitle
            FROM Review r
            LEFT JOIN User u ON r.Reviewer_ID = u.User_ID
            LEFT JOIN \`Order\` o ON r.Order_ID = o.Order_ID
            LEFT JOIN Product p ON o.Product_ID = p.Product_ID
            WHERE r.Reviewer_ID = ?
            ORDER BY r.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [reviewerId]);
        return rows as ReviewRow[];
    },

    // 4.Get reviews by Seller ID (Seller Reviews)
    findBySellerId: async (sellerId: number): Promise<ReviewRow[]> => {
        const sql = `
            SELECT r.*, u.Username AS ReviewerName, p.Title AS ProductTitle
            FROM Review r
            LEFT JOIN User u ON r.Reviewer_ID = u.User_ID
            LEFT JOIN \`Order\` o ON r.Order_ID = o.Order_ID
            LEFT JOIN Product p ON o.Product_ID = p.Product_ID
            WHERE r.Seller_ID = ?
            ORDER BY r.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [sellerId]);
        return rows as ReviewRow[];
    },

    // 5.Check if the order has been reviewed
    findByOrderId: async (orderId: number): Promise<ReviewRow | null> => {
        const sql = `SELECT * FROM Review WHERE Order_ID = ?`;
        const [rows] = await db.query<RowDataPacket[]>(sql, [orderId]);
        return rows.length > 0 ? (rows[0] as ReviewRow) : null;
    },

    // 6.Calculate the average rating of a seller
    getSellerRating: async (sellerId: number): Promise<SellerRating> => {
        const sql = `
            SELECT
                COALESCE(AVG(Rating), 0) AS averageRating,
                COUNT(*) AS totalReviews
            FROM Review
            WHERE Seller_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [sellerId]);
        const row = rows[0];
        return {
            averageRating: Number(row.averageRating) || 0,
            totalReviews: Number(row.totalReviews) || 0,
        };
    },
};
