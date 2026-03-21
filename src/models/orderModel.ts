import db from '@/src/lib/mysql';
import { Order } from '@/src/types/Order';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const OrderModel = {
    /** Find a single order by its ID */
    findByID: async (id: number): Promise<Order | null> => {
        const sql = `
            SELECT * FROM Purchase
            WHERE Order_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as Order) : null;
    },

    /** Retrieve all orders placed by a specific buyer, joined with product and user info */
    findByBuyerID: async (buyerID: number): Promise<Order[]> => {
        const sql = `
            SELECT o.*,
                p.Title, p.Image_URL,
                buyer.Username  AS BuyerName,
                seller.Username AS SellerName
            FROM Purchase o
            LEFT JOIN Product p      ON o.Product_ID = p.Product_ID
            LEFT JOIN User   buyer   ON o.Buyer_ID   = buyer.User_ID
            LEFT JOIN User   seller  ON o.Seller_ID  = seller.User_ID
            WHERE o.Buyer_ID = ?
            ORDER BY o.OrderDate DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [buyerID]);
        return rows as Order[];
    },

    /** Retrieve all orders received by a specific seller, joined with product and user info */
    findBySellerID: async (sellerID: number): Promise<Order[]> => {
        const sql = `
            SELECT o.*,
                p.Title, p.Image_URL,
                buyer.Username  AS BuyerName,
                seller.Username AS SellerName
            FROM Purchase o
            LEFT JOIN Product p      ON o.Product_ID = p.Product_ID
            LEFT JOIN User   buyer   ON o.Buyer_ID   = buyer.User_ID
            LEFT JOIN User   seller  ON o.Seller_ID  = seller.User_ID
            WHERE o.Seller_ID = ?
            ORDER BY o.OrderDate DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [sellerID]);
        return rows as Order[];
    },

    /** Retrieve all orders for a specific product */
    findByProductID: async (productID: number): Promise<Order[]> => {
        const sql = `
            SELECT * FROM Purchase
            WHERE Product_ID = ?
            ORDER BY OrderDate DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [productID]);
        return rows as Order[];
    },

    /** Search orders by matching product title */
    findByProductTitle: async (title: string): Promise<Order[]> => {
        const sql = `
            SELECT o.* FROM Purchase o
            JOIN Product p ON o.Product_ID = p.Product_ID
            WHERE p.Title LIKE ?
            ORDER BY o.OrderDate DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [`%${title}%`]);
        return rows as Order[];
    },

    /** Retrieve all orders filtered by status */
    findByStatus: async (status: string): Promise<Order[]> => {
        const sql = `
            SELECT * FROM Purchase
            WHERE Status = ?
            ORDER BY OrderDate DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [status]);
        return rows as Order[];
    },

    /** Retrieve all orders sorted by most recent */
    findAll: async (): Promise<Order[]> => {
        const sql = `
            SELECT * FROM Purchase
            ORDER BY OrderDate DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql);
        return rows as Order[];
    },

    /** Create a new order and return the inserted ID */
    createOrder: async (orderData: Order): Promise<number> => {
        const sql = `
            INSERT INTO Purchase (Product_ID, Buyer_ID, Seller_ID, Quantity, Total_Price)
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

    /** Update the status of an existing order */
    updateOrder: async (orderID: number, status: string): Promise<boolean> => {
        const sql = `
            UPDATE Purchase
            SET Status = ?
            WHERE Order_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [status, orderID]);
        return result.affectedRows > 0;
    },

    /** Set an order's status to cancelled */
    cancelOrder: async (orderID: number): Promise<boolean> => {
        const sql = `
            UPDATE Purchase
            SET Status = 'cancelled'
            WHERE Order_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [orderID]);
        return result.affectedRows > 0;
    },

    /** Create an order and decrement product quantity atomically; uses row-level locking to prevent race conditions */
    createOrderTransaction: async (newOrder: Order, productID: number, remainingQuantity: number, newProductStatus: string): Promise<number> => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Lock the product row to prevent race conditions
            const [lockedRows] = await connection.query<RowDataPacket[]>(
                `SELECT Quantity FROM Product WHERE Product_ID = ? FOR UPDATE`,
                [productID]
            );
            if (!lockedRows || lockedRows.length === 0) throw new Error('Product not found');
            const currentQty = lockedRows[0].Quantity;
            if (currentQty < newOrder.Quantity) throw new Error('Insufficient stock');

            const insertOrderSQL = `
                INSERT INTO Purchase (Product_ID, Buyer_ID, Seller_ID, Quantity, Total_Price, Status)
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

    /** Cancel an order and restore product stock atomically; uses row-level locking to prevent concurrent cancellation */
    cancelOrderTransaction: async (orderID: number, productID: number, restoredQuantity: number): Promise<boolean> => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Lock the product row to prevent race conditions when restoring stock
            const [lockedRows] = await connection.query<RowDataPacket[]>(
                `SELECT Quantity FROM Product WHERE Product_ID = ? FOR UPDATE`,
                [productID]
            );
            if (!lockedRows || lockedRows.length === 0) throw new Error('Product not found');

            // Lock the order row to prevent concurrent cancellation
            const [lockedOrder] = await connection.query<RowDataPacket[]>(
                `SELECT Status FROM Purchase WHERE Order_ID = ? FOR UPDATE`,
                [orderID]
            );
            if (!lockedOrder || lockedOrder.length === 0) throw new Error('Order not found');
            if (lockedOrder[0].Status === 'cancelled') throw new Error('Order is already cancelled');

            const currentQty = lockedRows[0].Quantity;
            const actualRestoredQuantity = currentQty + (restoredQuantity - currentQty);

            const updateProductSql = `
                UPDATE Product SET Quantity = ?, Status = 'available' WHERE Product_ID = ?
            `;
            await connection.query(updateProductSql, [actualRestoredQuantity, productID]);

            const updateOrderSql = `
                UPDATE Purchase SET Status = 'cancelled' WHERE Order_ID = ?
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
