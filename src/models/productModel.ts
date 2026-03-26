import db from "@/src/lib/mysql";
import { Product, ProductFilters, ProductWithSeller } from "@/src/types/Product";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { AppError } from "@/src/errors/AppError";
import { UserModel } from "./UserModel";

export const ProductModel = {
    /** Find a single non-banned product by ID, joined with seller and category info */
    findByID: async (id: number): Promise<ProductWithSeller | null> => {
        if (!id || id <= 0) throw new AppError("Invalid product ID", 400);
        const sql = `
            SELECT p.*, u.Username AS SellerName, u.Email AS SellerEmail, u.Phone_number AS SellerPhone_number,
                   u.Avatar_URL AS SellerAvatar, c.name AS Category_Name, c.category_key AS Category_Key
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            LEFT JOIN Category c ON p.Category_ID = c.Category_ID
            WHERE p.Product_ID = ?
            AND p.Is_Banned = 0
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as ProductWithSeller) : null;
    },

    /** Find all non-banned products belonging to a specific seller */
    findBySellerID: async (sellerID: number): Promise<ProductWithSeller[]> => {
        if (!sellerID || sellerID <= 0) throw new AppError("Invalid seller ID", 400);
        const sql = `
            SELECT p.*, u.Username AS SellerName, u.Email AS SellerEmail, u.Phone_number AS SellerPhone_number,
                   u.Avatar_URL AS SellerAvatar, c.name AS Category_Name, c.category_key AS Category_Key
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            LEFT JOIN Category c ON p.Category_ID = c.Category_ID
            WHERE p.Seller_ID = ?
            AND p.Is_Banned = 0
            ORDER BY p.Created_at DESC
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [sellerID]);
        return rows as ProductWithSeller[];
    },

    /** Search products with optional filters (category, condition, price range, location, keyword, sort) and return paginated results with total count */
    searchProducts: async (filters: ProductFilters): Promise<{ products: ProductWithSeller[]; total: number }> => {
        let whereSql = `
            WHERE 1=1
            AND p.Is_Banned = 0
        `;

        const values: (string | number)[] = [];

        if (filters.category) {
            whereSql += ` AND c.category_key = ?`;
            values.push(filters.category);
        }
        if (filters.condition) {
            whereSql += ` AND p.\`Condition\` = ?`;
            values.push(filters.condition);
        }
        if (filters.minPrice !== undefined) {
            whereSql += ` AND p.Price >= ?`;
            values.push(filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            whereSql += ` AND p.Price <= ?`;
            values.push(filters.maxPrice);
        }
        if (filters.status) {
            whereSql += ` AND p.Status = ?`;
            values.push(filters.status);
        }
        if (filters.province) {
            whereSql += ` AND p.Province = ?`;
            values.push(filters.province);
        }
        if (filters.district) {
            whereSql += ` AND p.District = ?`;
            values.push(filters.district);
        }
        if (filters.keyword) {
            whereSql += ` AND (p.Title LIKE ? OR p.Description LIKE ?)`;
            values.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
        }
        if (filters.excludeSeller) {
            whereSql += ` AND p.Seller_ID != ?`;
            values.push(filters.excludeSeller);
        }

        // Count total matching rows before applying pagination
        const countSql = `SELECT COUNT(*) AS total FROM Product p LEFT JOIN Category c ON p.Category_ID = c.Category_ID ${whereSql}`;
        const [countRows] = await db.query<RowDataPacket[]>(countSql, values);
        const total = countRows[0]?.total || 0;

        // Build the main data query with seller and category joins
        let dataSql = `
            SELECT p.*, u.Username AS SellerName, u.Email AS SellerEmail, u.Phone_number AS SellerPhone_number,
            u.Avatar_URL AS SellerAvatar, c.name AS Category_Name, c.category_key AS Category_Key
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            LEFT JOIN Category c ON p.Category_ID = c.Category_ID
            ${whereSql}
        `;

        if (filters.sortBy) {
            // SECURITY: sortBy is validated against a strict whitelist before being interpolated
            // into SQL. ORDER BY columns cannot be parameterized in MySQL, so the whitelist is required.
            const validSortFields = ['Price', 'Created_at', 'random'];
            if (!validSortFields.includes(filters.sortBy)) {
                throw new AppError("Invalid sort field", 400);
            }
            if (filters.sortBy === 'random') {
                dataSql += ` ORDER BY RAND()`;
            } else {
                const sortField = filters.sortBy === 'Price' ? 'p.Price' : 'p.Created_at';
                const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
                dataSql += ` ORDER BY ${sortField} ${sortOrder}`;
            }
        } else {
            dataSql += ` ORDER BY p.Created_at DESC`;
        }

        const limit = filters.limit ? Number(filters.limit) : 20;
        const page = filters.page ? Number(filters.page) : 1;
        const offset = (page - 1) * limit;

        dataSql += ` LIMIT ? OFFSET ?`;
        const dataValues = [...values, limit, offset];

        const [rows] = await db.query<RowDataPacket[]>(dataSql, dataValues);
        return { products: rows as ProductWithSeller[], total };
    },

    /** Create a new product after verifying the seller exists, and return the inserted ID */
    createProduct: async (productData: Product): Promise<number> => {
        const seller = await UserModel.findByIDSafe(productData.Seller_ID);
        if (!seller) throw new AppError("Seller not found", 404);
        const sql = `
            INSERT INTO Product (Seller_ID, Title, Description, Province, District, Price, \`Condition\`, Category_ID, Status, Quantity, Image_URL)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            productData.Seller_ID,
            productData.Title,
            productData.Description,
            productData.Province || null,
            productData.District || null,
            productData.Price,
            productData.Condition,
            productData.Category_ID,
            productData.Status || "available",
            productData.Quantity || 1,
            productData.Image_URL || null,
        ];
        const [result] = await db.query<ResultSetHeader>(sql, values);
        return result.insertId;
    },

    /** Update allowed fields of a product and return whether any row was affected */
    updateProduct: async (id: number, productData: Partial<Product>): Promise<boolean> => {
        const ALLOWED_FIELDS = ['Title', 'Description', 'Province', 'District', 'Price', 'Condition', 'Category_ID', 'Status', 'Quantity', 'Image_URL'];
        const keys = Object.keys(productData).filter(
            (key) => productData[key as keyof Product] !== undefined
                && key !== 'Product_ID'
                && key !== 'Seller_ID'
                && ALLOWED_FIELDS.includes(key)
        );

        if (keys.length === 0) return false;
        const setClause = keys.map((key) => `\`${key}\` = ?`).join(", ");
        const values = keys.map((key) => productData[key as keyof Product]);
        const sql = `
            UPDATE Product SET ${setClause}
            WHERE Product_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [...values, id]);
        return result.affectedRows > 0;
    },

    /** Permanently delete a product by ID */
    deleteProduct: async (id: number): Promise<boolean> => {
        const sql = `
            DELETE FROM Product
            WHERE Product_ID = ?
        `;
        const [result] = await db.query<ResultSetHeader>(sql, [id]);
        return result.affectedRows > 0;
    },

    /** Retrieve a paginated list of banned products including seller and category info (admin use) */
    findBannedProducts: async (offset: number, limit: number): Promise<ProductWithSeller[]> => {
        const sql = `
            SELECT p.*, u.Username AS SellerName, u.Email AS SellerEmail, u.Phone_number AS SellerPhone_number,
                   u.Avatar_URL AS SellerAvatar, c.name AS Category_Name, c.category_key AS Category_Key
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            LEFT JOIN Category c ON p.Category_ID = c.Category_ID
            WHERE p.Is_Banned = 1
            ORDER BY p.Created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [limit, offset]);
        return rows as ProductWithSeller[];
    },

    /** Find a product by ID regardless of its ban status (admin use) */
    findByIDIncludingBanned: async (id: number): Promise<ProductWithSeller | null> => {
        if (!id || id <= 0) throw new AppError("Invalid product ID", 400);
        const sql = `
            SELECT p.*, u.Username AS SellerName, u.Email AS SellerEmail, u.Phone_number AS SellerPhone_number,
                   u.Avatar_URL AS SellerAvatar, c.name AS Category_Name, c.category_key AS Category_Key
            FROM Product p
            LEFT JOIN User u ON p.Seller_ID = u.User_ID
            LEFT JOIN Category c ON p.Category_ID = c.Category_ID
            WHERE p.Product_ID = ?
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql, [id]);
        return rows.length > 0 ? (rows[0] as ProductWithSeller) : null;
    },

    /** Set the ban status of a product (admin only) */
    setBanStatus: async (id: number, isBanned: boolean): Promise<boolean> => {
        const sql = `UPDATE Product SET Is_Banned = ? WHERE Product_ID = ?`;
        const [result] = await db.query<ResultSetHeader>(sql, [isBanned ? 1 : 0, id]);
        return result.affectedRows > 0;
    }
};
