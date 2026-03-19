import { CategoryModel } from '../models/categoryModel';
import { CategoryPopularityModel } from '../models/categoryPopularityModel';
import { AppError } from '../errors/AppError';

export const CategoryService = {
    // 1.Get all categories
    getAll: async () => {
        return CategoryModel.findAll();
    },

    // 2.Retrieving popular categories (calculated from search and purchase data over the past 7 days) — fallback to sort_order if no data is available.
    getPopular: async (limit = 10) => {
        const popular = await CategoryPopularityModel.getPopular(limit);
        if (popular.length > 0) return popular;
        const all = await CategoryModel.findAll();
        return all.slice(0, limit).map(c => ({
            category_key: c.category_key,
            name: c.name,
            emoji: c.emoji,
            score: 0,
        }));
    },

    // 3.Record search or purchase events
    recordPopularity: async (categoryKey: string, eventType: 'search' | 'purchase') => {
        await CategoryPopularityModel.record(categoryKey, eventType);
    },

    // 4.Get category by key
    getByKey: async (key: string) => {
        const category = await CategoryModel.findByKey(key);
        if (!category) throw new AppError('Category not found', 404);
        return category;
    },

    // 5.Create a new category
    create: async (data: { category_key: string; name: string; emoji: string; sort_order?: number }) => {
        if (!data.category_key || !data.name || !data.emoji) {
            throw new AppError('category_key, name, and emoji are required', 400);
        }

        const existing = await CategoryModel.findByKey(data.category_key);
        if (existing) throw new AppError('Category key already exists', 409);

        const id = await CategoryModel.create(data);
        return CategoryModel.findById(id);
    },

    // 6.Update a category
    update: async (id: number, data: Partial<{ category_key: string; name: string; emoji: string; sort_order: number; is_active: boolean }>) => {
        const category = await CategoryModel.findById(id);
        if (!category) throw new AppError('Category not found', 404);

        if (data.category_key && data.category_key !== category.category_key) {
            const existing = await CategoryModel.findByKey(data.category_key);
            if (existing) throw new AppError('Category key already exists', 409);
        }

        const success = await CategoryModel.update(id, data);
        if (!success) throw new AppError('Failed to update category', 500);

        return CategoryModel.findById(id);
    },

    // 7.Delete a category
    delete: async (id: number): Promise<{ message: string }> => {
        const category = await CategoryModel.findById(id);
        if (!category) throw new AppError('Category not found', 404);

        const success = await CategoryModel.delete(id);
        if (!success) throw new AppError('Failed to delete category', 500);

        return { message: 'Category deleted successfully' };
    },
};
