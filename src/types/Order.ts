export interface Order {
    Order_ID?: number;
    Product_ID: number;
    Buyer_ID: number;
    Seller_ID: number;
    OrderDate?: Date;
    Quantity: number;
    Total_Price: number;
    Status: 'pending' | 'paid' | 'completed' | 'cancelled';
    Title?: string;
    Image_URL?: string;
    BuyerName?: string;
    SellerName?: string;
}

// Client-side API response type (dates as strings)
export interface OrderWithDetails {
    Order_ID: number;
    Product_ID: number;
    Buyer_ID: number;
    Seller_ID: number;
    OrderDate?: string;
    Created_at?: string;
    Quantity: number;
    Total_Price: number;
    Status: 'pending' | 'paid' | 'completed' | 'cancelled';
    Title?: string;
    BuyerName?: string;
    SellerName?: string;
    Image_URL?: string;
}