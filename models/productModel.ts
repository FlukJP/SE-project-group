import db from "@/lib/mysql";
import { Product, ProductWithSeller } from "@/types/Product";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const ProductModel = {
    // 1.ดึงข้อมูลสินค้าจาก ID (detail one by one)
    findByID: async (id: number): Promise<ProductWithSeller | null> => {
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.SellerID = u.UserID
            WHERE p.ProductID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as ProductWithSeller) : null;
    },

    // 2.ดึงข้อมูลสินค้าจาก User ID (Seller's Product List)
    findBySellerID: async (sellerID: number): Promise<ProductWithSeller[]> => {
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.SellerID = u.UserID
            WHERE p.SellerID = ? 
            ORDER BY p.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [sellerID]);
        return rows as ProductWithSeller[];
    },

    // 3.ดึงข้อมูลสินค้าตาม Category (Category Browsing)
    findByCategory: async (category: string): Promise<ProductWithSeller[]> => {
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.SellerID = u.UserID
            WHERE p.Category = ? 
            ORDER BY p.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [category]);
        return rows as ProductWithSeller[];
    },

    // 4.ดึงข้อมูลสินค้าตาม Condition (Condition Browsing)
    findByCondition: async (condition: string): Promise<ProductWithSeller[]> => {
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.SellerID = u.UserID
            WHERE p.Condition = ? 
            ORDER BY p.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [condition]);
        return rows as ProductWithSeller[];
    },

    // 5.ดึงข้อมูลสินค้าตาม Title (Search by Title)
    findByTitle: async (title: string): Promise<ProductWithSeller[]> => {
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.SellerID = u.UserID
            WHERE p.Title LIKE ? 
            ORDER BY p.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [`%${title}%`]);
        return rows as ProductWithSeller[];
    },

    // 6.ดึงข้อมูลสินค้าตาม Price Range (Search by Price Range)
    findByPriceRange: async (
        minPrice: number,
        maxPrice: number,
    ): Promise<ProductWithSeller[]> => {
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.SellerID = u.UserID
            WHERE p.Price BETWEEN ? AND ? 
            ORDER BY p.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [minPrice, maxPrice]);
        return rows as ProductWithSeller[];
    },

    // 7.ดึงข้อมูลสินค้าทั้งหมด (All Product List)
    findAll: async (): Promise<ProductWithSeller[]> => {
        const sql = `
            SELECT p.*, u.Username AS SellerName 
            FROM Product p
            LEFT JOIN User u ON p.SellerID = u.UserID
            ORDER BY p.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql);
        return rows as ProductWithSeller[];
    },

    // 8.สร้างสินค้าใหม่ (Create Product)
    createProduct: async (productData: Product): Promise<number> => {
        const sql = `
            INSERT INTO Product (SellerID, Title, Description, Price, Condition, Category, Status, Quantity, Image_URL) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            productData.SellerID,
            productData.Title,
            productData.Description,
            productData.Price,
            productData.Condition,
            productData.Category,
            productData.Status || "available",
            productData.Quantity || 1,
            productData.Image_URL || null,
        ];
        const [result] = await db.query<ResultSetHeader>(sql, values);
        return result.insertId;
    },

    // 9.Update ข้อมูลสินค้า (Edit Product)
    updateProduct: async (
        id: number,
        productData: Partial<Product>,
    ): Promise<boolean> => {
        const keys = Object.keys(productData).filter(
            (key) => productData[key as keyof Product] !== undefined,
        );
        if (keys.length === 0) return false;
        const setClause = keys.map((key) => `${key} = ?`).join(", ");
        const values = keys.map((key) => productData[key as keyof Product]);
        const sql = `
            UPDATE Product SET ${setClause} 
            WHERE ProductID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [...values, id]);
        return result.affectedRows > 0;
    },

    // 10.ลบสินค้า (Delete Product)
    deleteProduct: async (id: number): Promise<boolean> => {
        const sql = `
            DELETE FROM Product 
            WHERE ProductID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [id]);
        return result.affectedRows > 0;
    },
};
