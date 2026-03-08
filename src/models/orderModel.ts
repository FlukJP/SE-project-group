import db from '@/src/lib/mysql';
import { Order } from '@/src/types/Order';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const OrderModel = {
    // 1.ดึงข้อมูล Order จาก ID (Detail one by one)
    findByID: async (id: number): Promise<Order | null> => {
        const sql = `
            SELECT * FROM \`Order\`
            WHERE Order_ID = ?
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
            SELECT * FROM \`Order\`
            WHERE Seller_ID = ?
            ORDER BY Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [sellerID]);
        return rows as Order[];
    },

    // 4.ดึงข้อมูล Order จาก Product ID (Product Order List)
    findByProductID: async (productID: number): Promise<Order[]> => {
        const sql = `
            SELECT * FROM \`Order\`
            WHERE Product_ID = ?
            ORDER BY Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [productID]);
        return rows as Order[];
    },

    // 5.ดึงข้อมูล Order จาก Product Title (Search by Product Title)
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

    // 6.ดึงข้อมูล Order จาก Status (Search by Order Status)
    findByStatus: async (status: string): Promise<Order[]> => {
        const sql = `
            SELECT * FROM \`Order\`
            WHERE Status = ?
            ORDER BY Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [status]);
        return rows as Order[];
    },

    // 7.ดึงข้อมูล Order ทั้งหมด (All Order List)
    findAll: async (): Promise<Order[]> => {
        const sql = `
            SELECT * FROM \`Order\`
            ORDER BY Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql);
        return rows as Order[];
    },

    // 8.สร้าง Order ใหม่ (Create Order)
    createOrder: async (orderData: Order): Promise<number> => {
        const sql = `
            INSERT INTO \`Order\` (Product_ID, Buyer_ID, Seller_ID, Quantity, Total_Price)
            VALUES (?, ?, ?, ?, ?)
        `;
        const values = [
            orderData.Product_ID,
            orderData.Buyer_ID,
            orderData.Seller_ID,
            orderData.Quantity,
            orderData.Total_Price
        ];
        const [result] = await db.query<ResultSetHeader>(sql, values);
        return result.insertId;
    },

    // 9.Update ข้อมูล Order (Update Order Status)
    updateOrder: async (orderID: number, status: string): Promise<boolean> => {
        const sql = `
            UPDATE \`Order\`
            SET Status = ?
            WHERE Order_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [status, orderID]);
        return result.affectedRows > 0;
    },

    // 10.ยกเลิก Order (Cancel Order)
    cancelOrder: async (orderID: number): Promise<boolean> => {
        const sql = `
            UPDATE \`Order\`
            SET Status = 'cancelled'
            WHERE Order_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [orderID]);
        return result.affectedRows > 0;
    },

    // 11.Transaction
    createOrderTransaction: async (newOrder: Order, productID: number, remainingQuantity: number, newProductStatus: string): Promise<number> => {
        const connection = await db.getConnection();
        try{
            await connection.beginTransaction();

            // Lock the product row to prevent race conditions
            const [lockedRows] = await connection.query<RowDataPacket[]>(
                `SELECT Quantity FROM Product WHERE Product_ID = ? FOR UPDATE`,
                [productID]
            );
            if (!lockedRows || lockedRows.length === 0) {
                throw new Error('Product not found');
            }
            const currentQty = lockedRows[0].Quantity;
            if (currentQty < newOrder.Quantity) {
                throw new Error('Insufficient stock');
            }

            const insertOrderSQL = `
            INSERT INTO \`Order\` (Product_ID, Buyer_ID, Seller_ID, Quantity, Total_Price, Status)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const orderValues = [
                newOrder.Product_ID,
                newOrder.Buyer_ID,
                newOrder.Seller_ID,
                newOrder.Quantity,
                newOrder.Total_Price,
                newOrder.Status
            ];

            const [orderResult] = await connection.query<ResultSetHeader>(insertOrderSQL, orderValues);
            const orderID = orderResult.insertId;

            const updateProductSql = `
                UPDATE Product 
                SET Quantity = ?, Status = ? 
                WHERE Product_ID = ?
            `;
            await connection.query(updateProductSql, [remainingQuantity, newProductStatus, productID]);
            await connection.commit();
            return orderID;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // 12. Cancel Order Transaction
    cancelOrderTransaction: async (orderID: number, productID: number, restoredQuantity: number): Promise<boolean> => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Lock the product row to prevent race conditions when restoring stock
            const [lockedRows] = await connection.query<RowDataPacket[]>(
                `SELECT Quantity FROM Product WHERE Product_ID = ? FOR UPDATE`,
                [productID]
            );
            if (!lockedRows || lockedRows.length === 0) {
                throw new Error('Product not found');
            }

            // Lock the order row to prevent concurrent cancellation
            const [lockedOrder] = await connection.query<RowDataPacket[]>(
                `SELECT Status FROM \`Order\` WHERE Order_ID = ? FOR UPDATE`,
                [orderID]
            );
            if (!lockedOrder || lockedOrder.length === 0) {
                throw new Error('Order not found');
            }
            if (lockedOrder[0].Status === 'cancelled') {
                throw new Error('Order is already cancelled');
            }

            // Recalculate restored quantity from the locked current value
            const currentQty = lockedRows[0].Quantity;
            const actualRestoredQuantity = currentQty + (restoredQuantity - currentQty);

            const updateProductSql = `
                UPDATE Product SET Quantity = ?, Status = 'available' WHERE Product_ID = ?
            `;
            await connection.query(updateProductSql, [actualRestoredQuantity, productID]);

            const updateOrderSql = `
                UPDATE \`Order\` SET Status = 'cancelled' WHERE Order_ID = ?
            `;
            await connection.query(updateOrderSql, [orderID]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};