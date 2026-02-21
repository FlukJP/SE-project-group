export interface Order {
    Order_ID?: number;
    Product_ID: number;
    Buyer_ID: number;
    OrderDate?: Date;
    Quantity: number;
    Total_Price: number;
    Status?: 'pending' | 'paid' | 'completed' | 'cancelled';
}