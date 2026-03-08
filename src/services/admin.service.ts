import { UserModel } from "../models/UserModel";
import { ReportModel } from "../models/reportModel";
import { ProductModel } from "../models/productModel";
import { AppError } from "../errors/AppError";

export const AdminService = {
    // 1.Get all user
    getAllUsers: async (page: number = 1, limit: number = 20) => {
        const offset = (page - 1) * limit;
        const users = await UserModel.findAll(offset, limit);
        return users;
    },

    // 2.Gat all banned user
    getBannedUsers: async (page: number = 1, limit: number = 20) => {
        const offset = (page - 1) * limit;
        const users = await UserModel.findBannedUsers(offset, limit);
        return users;
    },

    // 3.Ban user
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

    // 4.Unban user
    unbanUser: async (targetUserID: number) => {
        if (!targetUserID) throw new AppError("Target User ID is required", 400);
        const user = await UserModel.findByIDSafe(targetUserID);
        if (!user) throw new AppError("User not found", 404);
        if (!user.Is_Banned) throw new AppError("User is not banned", 400);

        const success = await UserModel.updateUser(targetUserID, { Is_Banned: false } );
        if (!success) throw new AppError("Failed to unban user", 500);
        return { message: `User ID ${targetUserID} has been unbanned successfully.` };
    },

    // 5.Get all banned products
    getBannedProducts: async (page: number = 1, limit: number = 20) => {
        const offset = (page - 1) * limit;
        const products = await ProductModel.findBannedProducts(offset, limit);
        return products;
    },

    // 5.Ban product
    banProduct: async (productID: number) => {
        if (!productID) throw new AppError("Product ID is required", 400);
        const product = await ProductModel.findByIDIncludingBanned(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Is_Banned) throw new AppError("Product is already banned", 400);

        const success = await ProductModel.updateProduct(productID, { Is_Banned: true } );
        if (!success) throw new AppError("Failed to ban product. Please try again.", 500);
        return { message: `Product ID ${productID} has been banned.` };
    },

    // 6.Unban product
    unbanProduct: async (productID: number) => {
        if (!productID) throw new AppError("Product ID is required", 400);
        const product = await ProductModel.findByIDIncludingBanned(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (!product.Is_Banned) throw new AppError("Product is not banned", 400);

        const success = await ProductModel.updateProduct(productID, { Is_Banned: false } );
        if (!success) throw new AppError("Failed to unban product", 500);
        return { message: `Product ID ${productID} has been unbanned successfully.` };
    },

    // 7.See reports
    getAllReports: async (page: number = 1, limit: number = 20) => {
        const offset = (page - 1) * limit;
        const reports = await ReportModel.findAll(offset, limit);
        return reports;
    }
};