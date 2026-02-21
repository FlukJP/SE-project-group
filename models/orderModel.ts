import db from '@/lib/mysql';
import { Order } from '@/types/Order';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const OrderModel = {
    // 1.ดึงข้อมูล Order จาก ID (Detail one by one)
    findByID: async (id: number): Promise<Order | null> => {
        const sql = `
            SELECT * FROM \`Order\`
            WHERE OrderID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as Order) : null;
    },

    // 2.ดึงข้อมูล Order จาก Buyer ID (Buyer Order List)
    findByBuyerID: async (buyerID: number): Promise<Order[]> => {
        const sql = `
            SELECT * FROM \`Order\`
            WHERE Buyer_ID = ?
            ORDER BY Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [buyerID]);
        return rows as Order[];
    },

    // 3.ดึงข้อมูล Order จาก Seller ID (Seller Order List)
    findBySellerID: async (sellerID: number): Promise<Order[]> => {
        const sql = `
            SELECT o.* FROM \`Order\` o
            JOIN Product p ON o.Product_ID = p.Product_ID
            WHERE p.Seller_ID = ?
            ORDER BY o.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [sellerID]);
        return rows as Order[];
    },

    // 4.ดึงข้อมูล Order จาก Product ID (Product Order List)
    findByProductID: async (productID: number): Promise<Order[]> => {
        const sql = `
            SELECT * FROM \`Order\`
            WHERE ProductID = ? 
            ORDER BY Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [productID]);
        return rows as Order[];
    },

    // 6.ดึงข้อมูล Order จาก Product Title (Search by Product Title)
    findByProductTitle: async (title: string): Promise<Order[]> => {
        const sql = `
            SELECT o.* FROM \`Order\` o
            JOIN Product p ON o.Product_ID = p.Product_ID
            WHERE p.Title LIKE ?
            ORDER BY o.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [`%${title}%`]);
        return rows as Order[];
    },

    // 7.ดึงข้อมูล Order จาก Status (Search by Order Status)
    findByStatus: async (status: string): Promise<Order[]> => {
        const sql = `
            SELECT * FROM \`Order\`
            WHERE Status = ?
            ORDER BY Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [status]);
        return rows as Order[];
    },

    // 9.ดึงข้อมูล Order ทั้งหมด (All Order List)
    findAll: async (): Promise<Order[]> => {
        const sql = `
            SELECT * FROM \`Order\`
            ORDER BY Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql);
        return rows as Order[];
    },

    // 10.สร้าง Order ใหม่ (Create Order)
    createOrder: async (orderData: Order): Promise<number> => {
        const sql = `
            INSERT INTO \`Order\` (Product_ID, Buyer_ID, Quantity, Total_Price)
            VALUES (?, ?, ?, ?)
        `;
        const values = [
            orderData.Product_ID,
            orderData.Buyer_ID,
            orderData.Quantity,
            orderData.Total_Price
        ];
        const [result] = await db.query<ResultSetHeader>(sql, values);
        return result.insertId;
    },

    // 11.Update ข้อมูล Order (Update Order Status)
    updateOrder: async (orderID: number, status: string): Promise<boolean> => {
        const sql = `
            UPDATE \`Order\`
            SET Status = ?
            WHERE Order_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [status, orderID]);
        return result.affectedRows > 0;
    },

    // 12.ยกเลิก Order (Cancel Order)
    cancelOrder: async (orderID: number): Promise<boolean> => {
        // เปลี่ยนมาใช้ UPDATE แทน DELETE
        const sql = `
            UPDATE \`Order\`
            SET Status = 'cancelled'
            WHERE Order_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [orderID]);
        return result.affectedRows > 0;
    }
};