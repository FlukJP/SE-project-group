import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { AdminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const AdminController = {
    /** Return a paginated list of all users */
    getAllUsers: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const { data: users, total } = await AdminService.getAllUsers(page, limit);

            res.status(200).json({ success: true, data: users, pagination: { page, limit, total } });
        } catch (error) {
            next(error);
        }
    },

    /** Return a paginated list of banned users */
    getBannedUsers: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const { data: users, total } = await AdminService.getBannedUsers(page, limit);

            res.status(200).json({ success: true, data: users, pagination: { page, limit, total } });
        } catch (error) {
            next(error);
        }
    },

    /** Ban a user by their ID */
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

    /** Unban a user by their ID */
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

    /** Return a paginated list of banned products */
    getBannedProducts: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const { data: products, total } = await AdminService.getBannedProducts(page, limit);

            res.status(200).json({ success: true, data: products, pagination: { page, limit, total } });
        } catch (error) {
            next(error);
        }
    },

    /** Ban a product by its ID */
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

    /** Unban a product by its ID */
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

    /** Return a paginated list of all user and product reports */
    getAllReports: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const { data: reports, total } = await AdminService.getAllReports(page, limit);

            res.status(200).json({ success: true, data: reports, pagination: { page, limit, total } });
        } catch (error) {
            next(error);
        }
    },

    /** Return aggregate statistics for the admin dashboard */
    getStats: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const stats = await AdminService.getStats();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    },
};
