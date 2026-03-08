export interface Order {
    Order_ID?: number;
    Product_ID: number;
    Buyer_ID: number;
    Seller_ID: number;
    OrderDate?: Date;
    Created_at?: Date | string;
    Quantity: number;
    Total_Price: number;
    Status: 'pending' | 'paid' | 'completed' | 'cancelled';
    // Joined fields (populated by findByBuyerID / findBySellerID)
    Title?: string;
    Image_URL?: string;
    BuyerName?: string;
    SellerName?: string;
}