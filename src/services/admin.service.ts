import db from "@/src/lib/mysql";
import { RowDataPacket } from "mysql2";
import { UserModel } from "../models/UserModel";
import { ReportModel } from "../models/reportModel";
import { ProductModel } from "../models/productModel";
import { AppError } from "../errors/AppError";

export const AdminService = {
    /** Retrieve a paginated list of all users with a total count */
    getAllUsers: async (page: number = 1, limit: number = 20) => {
        const offset = (page - 1) * limit;
        const users = await UserModel.findAll(offset, limit);
        const [[{ total }]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM `User` WHERE Is_Banned = 0');
        return { data: users, total: Number(total) };
    },

    /** Retrieve a paginated list of banned users with a total count */
    getBannedUsers: async (page: number = 1, limit: number = 20) => {
        const offset = (page - 1) * limit;
        const users = await UserModel.findBannedUsers(offset, limit);
        const [[{ total }]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM `User` WHERE Is_Banned = 1');
        return { data: users, total: Number(total) };
    },

    /** Ban a user by setting Is_Banned to true; prevents banning admins or already-banned users */
    banUser: async (targetUserID: number) => {
        if (!targetUserID) throw new AppError("Target User ID is required", 400);
        const user = await UserModel.findByIDSafe(targetUserID);
        if (!user) throw new AppError("User not found", 404);
        if (user.Is_Banned) throw new AppError("User is already banned", 400);
        if (user.Role === 'admin') throw new AppError("Cannot ban an admin user", 403);

        const success = await UserModel.updateUser(targetUserID, { Is_Banned: true });
        if (!success) throw new AppError("Failed to ban user. Please try again.", 500);
        return { message: `User ID ${targetUserID} has been banned.` };
    },

    /** Unban a user by setting Is_Banned to false */
    unbanUser: async (targetUserID: number) => {
        if (!targetUserID) throw new AppError("Target User ID is required", 400);
        const user = await UserModel.findByIDSafe(targetUserID);
        if (!user) throw new AppError("User not found", 404);
        if (!user.Is_Banned) throw new AppError("User is not banned", 400);

        const success = await UserModel.updateUser(targetUserID, { Is_Banned: false });
        if (!success) throw new AppError("Failed to unban user", 500);
        return { message: `User ID ${targetUserID} has been unbanned successfully.` };
    },

    /** Retrieve a paginated list of banned products with a total count */
    getBannedProducts: async (page: number = 1, limit: number = 20) => {
        const offset = (page - 1) * limit;
        const products = await ProductModel.findBannedProducts(offset, limit);
        const [[{ total }]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM Product WHERE Is_Banned = 1');
        return { data: products, total: Number(total) };
    },

    /** Ban a product by setting Is_Banned to true */
    banProduct: async (productID: number) => {
        if (!productID) throw new AppError("Product ID is required", 400);
        const product = await ProductModel.findByIDIncludingBanned(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Is_Banned) throw new AppError("Product is already banned", 400);

        const success = await ProductModel.setBanStatus(productID, true);
        if (!success) throw new AppError("Failed to ban product. Please try again.", 500);
        return { message: `Product ID ${productID} has been banned.` };
    },

    /** Unban a product by setting Is_Banned to false */
    unbanProduct: async (productID: number) => {
        if (!productID) throw new AppError("Product ID is required", 400);
        const product = await ProductModel.findByIDIncludingBanned(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (!product.Is_Banned) throw new AppError("Product is not banned", 400);

        const success = await ProductModel.setBanStatus(productID, false);
        if (!success) throw new AppError("Failed to unban product", 500);
        return { message: `Product ID ${productID} has been unbanned successfully.` };
    },

    /** Retrieve a paginated list of all reports with a total count */
    getAllReports: async (page: number = 1, limit: number = 20) => {
        const offset = (page - 1) * limit;
        const reports = await ReportModel.findAll(offset, limit);
        const [[{ total }]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM Report');
        return { data: reports, total: Number(total) };
    },

    /** Fetch aggregate counts of users, products, reports, and categories for the admin dashboard */
    getStats: async () => {
        const sql = `
            SELECT
                (SELECT COUNT(*) FROM User WHERE Is_Banned = 0) AS totalUsers,
                (SELECT COUNT(*) FROM User WHERE Is_Banned = 1) AS bannedUsers,
                (SELECT COUNT(*) FROM Product WHERE Is_Banned = 0) AS totalProducts,
                (SELECT COUNT(*) FROM Product WHERE Is_Banned = 1) AS bannedProducts,
                (SELECT COUNT(*) FROM Report) AS totalReports,
                (SELECT COUNT(*) FROM Category) AS totalCategories
        `;
        const [rows] = await db.query<RowDataPacket[]>(sql);
        const row = rows[0];
        return {
            totalUsers: Number(row.totalUsers),
            bannedUsers: Number(row.bannedUsers),
            totalProducts: Number(row.totalProducts),
            bannedProducts: Number(row.bannedProducts),
            totalReports: Number(row.totalReports),
            totalCategories: Number(row.totalCategories),
        };
    }
};
