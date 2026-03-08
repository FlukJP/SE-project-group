export interface ReviewRow {
    Review_ID: number;
    Order_ID: number;
    Reviewer_ID: number;
    Seller_ID: number;
    Rating: number;
    Comment: string | null;
    Created_at: string;
    ReviewerName?: string;
    ProductTitle?: string;
}

export interface SellerRating {
    averageRating: number;
    totalReviews: number;
}