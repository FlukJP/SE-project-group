import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { CategoryService } from '../services/category.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const CategoryController = {
    // 1.Get All Categories
    getAll: async (_req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const categories = await CategoryService.getAll();
            res.status(200).json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    },

    // 2.Get Popular
    getPopular: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const limit = Number(req.query.limit) || 10;
            const categories = await CategoryService.getPopular(limit);
            res.status(200).json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    },

    // 3.Create Category
    create: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { category_key, name, emoji, sort_order } = req.body;
            const category = await CategoryService.create({ category_key, name, emoji, sort_order });
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    },

    // 4.Update Category
    update: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            if (!id || id <= 0) throw new AppError('Invalid category ID', 400);

            const category = await CategoryService.update(id, req.body);
            res.status(200).json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    },

    // 5.Delete Category
    delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            if (!id || id <= 0) throw new AppError('Invalid category ID', 400);

            const result = await CategoryService.delete(id);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    },
};
