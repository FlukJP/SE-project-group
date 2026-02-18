export interface Order {
    OrderID?: number;
    ProductID: number;
    BuyerID: number;
    OrderDate?: Date;
    Quantity: number;
    Total_Price: number;
    Status?: 'pending' | 'paid' | 'completed' | 'cancelled';
}