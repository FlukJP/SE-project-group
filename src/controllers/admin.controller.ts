import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { AdminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const AdminController = {
    // 1.ดูรายการผู้ใช้ทั้งหมด (Get All Users)
    getAllUsers: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const users = await AdminService.getAllUsers(page, limit);

            res.status(200).json({ success: true, data: users, pagination: { page, limit } });
        } catch (error) {
            next(error);
        }
    },

    // 2.ดูรายการผู้ใช้ที่โดน Ban (Get Banned Users)
    getBannedUsers: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const users = await AdminService.getBannedUsers(page, limit);

            res.status(200).json({ success: true, data: users, pagination: { page, limit } });
        } catch (error) {
            next(error);
        }
    },

    // 3.Ban ผู้ใช้ (Ban User)
    banUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = Number(req.params.userId);
            if (!userId || userId <= 0) throw new AppError("Invalid user ID", 400);

            const result = await AdminService.banUser(userId);

            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    },

    // 4.Unban ผู้ใช้ (Unban User)
    unbanUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = Number(req.params.userId);
            if (!userId || userId <= 0) throw new AppError("Invalid user ID", 400);

            const result = await AdminService.unbanUser(userId);

            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    },

    // 5.ดูรายการสินค้าที่โดน Ban (Get Banned Products)
    getBannedProducts: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const products = await AdminService.getBannedProducts(page, limit);

            res.status(200).json({ success: true, data: products, pagination: { page, limit } });
        } catch (error) {
            next(error);
        }
    },

    // 6.Ban สินค้า (Ban Product)
    banProduct: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const productId = Number(req.params.productId);
            if (!productId || productId <= 0) throw new AppError("Invalid product ID", 400);

            const result = await AdminService.banProduct(productId);

            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    },

    // 7.Unban สินค้า (Unban Product)
    unbanProduct: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const productId = Number(req.params.productId);
            if (!productId || productId <= 0) throw new AppError("Invalid product ID", 400);

            const result = await AdminService.unbanProduct(productId);

            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    },

    // 8.ดูรายงานทั้งหมด (Get All Reports)
    getAllReports: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const reports = await AdminService.getAllReports(page, limit);

            res.status(200).json({ success: true, data: reports, pagination: { page, limit } });
        } catch (error) {
            next(error);
        }
    },
};
