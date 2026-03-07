import db from "@/src/lib/mysql";
import { Product, ProductFilters, ProductWithSeller } from "@/src/types/Product";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { AppError } from "@/src/errors/AppError";
import { UserModel } from "./UserModel";

export const ProductModel = {
    // 1.ดึงข้อมูลสินค้าจาก ID (detail one by one)
    findByID: async (id: number): Promise<ProductWithSeller | null> => {
        if (!id || id <= 0) throw new AppError("Invalid product ID", 400);
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            WHERE p.Product_ID = ?
            AND p.Is_Banned = 0
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as ProductWithSeller) : null;
    },

    // 2.ดึงข้อมูลสินค้าจาก User ID (Seller's Product List)
    findBySellerID: async (sellerID: number): Promise<ProductWithSeller[]> => {
        if (!sellerID || sellerID <= 0) throw new AppError("Invalid seller ID", 400);
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            WHERE p.Seller_ID = ? 
            AND p.Is_Banned = 0
            ORDER BY p.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [sellerID]);
        return rows as ProductWithSeller[];
    },

    // 3.ค้นหาสินค้า (Search Products)
    searchProducts: async (filters: ProductFilters): Promise<ProductWithSeller[]> => {
        let sql = `
            SELECT p.*, u.Username AS SellerName 
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            WHERE 1=1
            AND p.Is_Banned = 0
        `;
        
        const values: any[] = [];

        if (filters.category) {
            sql += ` AND p.Category = ?`;
            values.push(filters.category);
        }
        if (filters.condition) {
            sql += ` AND p.Condition = ?`;
            values.push(filters.condition);
        }
        if (filters.minPrice !== undefined) {
            sql += ` AND p.Price >= ?`;
            values.push(filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            sql += ` AND p.Price <= ?`;
            values.push(filters.maxPrice);
        }
        if (filters.status) {
            sql += ` AND p.Status = ?`;
            values.push(filters.status);
        }
        if (filters.keyword) {
            sql += ` AND (p.Title LIKE ? OR p.Description LIKE ?)`;
            values.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
        }
        if (filters.sortBy) {
            const validSortFields = ['Price', 'Created_at'];
            if (!validSortFields.includes(filters.sortBy)) {
                throw new AppError("Invalid sort field", 400);
            }
            const sortField = filters.sortBy === 'Price' ? 'p.Price' : 'p.Created_at';
            const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
            sql += ` ORDER BY ${sortField} ${sortOrder}`;
        } else {
            sql += ` ORDER BY p.Created_at DESC`;
        }

        const limit = filters.limit ? Number(filters.limit) : 20;
        const page = filters.page ? Number(filters.page) : 1;
        const offset = (page - 1) * limit;

        sql += ` LIMIT ? OFFSET ?`;
        values.push(limit, offset);

        const [rows] = await db.query<RowDataPacket[]>(sql, values);
        return rows as ProductWithSeller[];
    },

    // 4.สร้างสินค้าใหม่ (Create Product)
    createProduct: async (productData: Product): Promise<number> => {
        const seller = await UserModel.findByID(productData.Seller_ID);
        if (!seller) throw new AppError("Seller not found", 404);
        const sql = `
            INSERT INTO Product (Seller_ID, Title, Description, Price, Condition, Category, Status, Quantity, Image_URL) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            productData.Seller_ID,
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

    // 5.Update ข้อมูลสินค้า (Edit Product)
    updateProduct: async ( id: number, productData: Partial<Product> ): Promise<boolean> => {
        const keys = Object.keys(productData).filter(
            (key) => productData[key as keyof Product] !== undefined && key !== 'Product_ID' && key !== 'Seller_ID'
        );
        if (keys.length === 0) return false;
        const setClause = keys.map((key) => `${key} = ?`).join(", ");
        const values = keys.map((key) => productData[key as keyof Product]);
        const sql = `
            UPDATE Product SET ${setClause} 
            WHERE Product_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [...values, id]);
        return result.affectedRows > 0;
    },

    // 6.ลบสินค้า (Delete Product)
    deleteProduct: async (id: number): Promise<boolean> => {
        const sql = `
            DELETE FROM Product 
            WHERE Product_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [id]);
        return result.affectedRows > 0;
    },

    // 7.ดึงข้อมูลสินค้าที่โดนBan (Admin List)
    findBannedProducts: async (offset: number, limit: number): Promise<ProductWithSeller[]> => {
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            WHERE p.Is_Banned = 1
            ORDER BY p.Created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [limit, offset]);
        return rows as ProductWithSeller[];
    },

    // 8.ดึงข้อมูลสินค้าจาก ID รวมที่โดน Ban (สำหรับ Admin)
    findByIDIncludingBanned: async (id: number): Promise<ProductWithSeller | null> => {
        if (!id || id <= 0) throw new AppError("Invalid product ID", 400);
        const sql = `
            SELECT p.*, u.Username AS SellerName
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            WHERE p.Product_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as ProductWithSeller) : null;
    }
};
