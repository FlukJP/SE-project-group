import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '@/src/services/category.service';
import { CategoryModel } from '@/src/models/categoryModel';
import { CategoryPopularityModel } from '@/src/models/categoryPopularityModel';

vi.mock('@/src/models/categoryModel');
vi.mock('@/src/models/categoryPopularityModel');

const sampleCategory = {
    Category_ID: 1,
    category_key: 'phones',
    name: 'Phones',
    emoji: '📱',
    sort_order: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
};

describe('CategoryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ===== getAll =====
    describe('getAll', () => {
        it('should return all categories', async () => {
            vi.mocked(CategoryModel.findAll).mockResolvedValue([sampleCategory]);

            const result = await CategoryService.getAll();
            expect(result).toHaveLength(1);
            expect(CategoryModel.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when no categories', async () => {
            vi.mocked(CategoryModel.findAll).mockResolvedValue([]);

            const result = await CategoryService.getAll();
            expect(result).toEqual([]);
        });
    });

    // ===== getPopular =====
    describe('getPopular', () => {
        it('should return popular categories from popularity model', async () => {
            const popular = [{ category_key: 'phones', name: 'Phones', emoji: '📱', score: 10 }];
            vi.mocked(CategoryPopularityModel.getPopular).mockResolvedValue(popular);

            const result = await CategoryService.getPopular(10);
            expect(result).toEqual(popular);
            expect(CategoryModel.findAll).not.toHaveBeenCalled();
        });

        it('should fall back to CategoryModel.findAll when no popularity data', async () => {
            vi.mocked(CategoryPopularityModel.getPopular).mockResolvedValue([]);
            vi.mocked(CategoryModel.findAll).mockResolvedValue([sampleCategory]);

            const result = await CategoryService.getPopular(10);
            expect(result).toHaveLength(1);
            expect(result[0].score).toBe(0);
            expect(CategoryModel.findAll).toHaveBeenCalledTimes(1);
        });

        it('should limit fallback results to the specified limit', async () => {
            const categories = Array.from({ length: 5 }, (_, i) => ({
                ...sampleCategory,
                Category_ID: i + 1,
                category_key: `cat-${i}`,
            }));
            vi.mocked(CategoryPopularityModel.getPopular).mockResolvedValue([]);
            vi.mocked(CategoryModel.findAll).mockResolvedValue(categories);

            const result = await CategoryService.getPopular(3);
            expect(result).toHaveLength(3);
        });
    });

    // ===== recordPopularity =====
    describe('recordPopularity', () => {
        it('should record search event', async () => {
            vi.mocked(CategoryPopularityModel.record).mockResolvedValue();

            await CategoryService.recordPopularity('phones', 'search');
            expect(CategoryPopularityModel.record).toHaveBeenCalledWith('phones', 'search');
        });

        it('should record purchase event', async () => {
            vi.mocked(CategoryPopularityModel.record).mockResolvedValue();

            await CategoryService.recordPopularity('phones', 'purchase');
            expect(CategoryPopularityModel.record).toHaveBeenCalledWith('phones', 'purchase');
        });
    });

    // ===== getByKey =====
    describe('getByKey', () => {
        it('should return category when found', async () => {
            vi.mocked(CategoryModel.findByKey).mockResolvedValue(sampleCategory);

            const result = await CategoryService.getByKey('phones');
            expect(result).toEqual(sampleCategory);
        });

        it('should throw 404 when category not found', async () => {
            vi.mocked(CategoryModel.findByKey).mockResolvedValue(null);

            await expect(CategoryService.getByKey('unknown')).rejects.toThrow('Category not found');
        });
    });

    // ===== create =====
    describe('create', () => {
        it('should throw when required fields are missing', async () => {
            await expect(
                CategoryService.create({ category_key: '', name: 'Phones', emoji: '📱' })
            ).rejects.toThrow('category_key, name, and emoji are required');

            await expect(
                CategoryService.create({ category_key: 'phones', name: '', emoji: '📱' })
            ).rejects.toThrow('category_key, name, and emoji are required');

            await expect(
                CategoryService.create({ category_key: 'phones', name: 'Phones', emoji: '' })
            ).rejects.toThrow('category_key, name, and emoji are required');
        });

        it('should throw 409 when category key already exists', async () => {
            vi.mocked(CategoryModel.findByKey).mockResolvedValue(sampleCategory);

            await expect(
                CategoryService.create({ category_key: 'phones', name: 'Mobile Phones', emoji: '📞' })
            ).rejects.toThrow('Category key already exists');
        });

        it('should create category successfully', async () => {
            vi.mocked(CategoryModel.findByKey).mockResolvedValue(null);
            vi.mocked(CategoryModel.create).mockResolvedValue(2);
            vi.mocked(CategoryModel.findById).mockResolvedValue({ ...sampleCategory, Category_ID: 2, category_key: 'laptops' });

            const result = await CategoryService.create({ category_key: 'laptops', name: 'Laptops', emoji: '💻' });
            expect(result).toBeDefined();
            expect(CategoryModel.create).toHaveBeenCalledTimes(1);
        });
    });

    // ===== update =====
    describe('update', () => {
        it('should throw 404 when category not found', async () => {
            vi.mocked(CategoryModel.findById).mockResolvedValue(null);

            await expect(CategoryService.update(999, { name: 'New Name' })).rejects.toThrow('Category not found');
        });

        it('should throw 409 when new category key already exists', async () => {
            vi.mocked(CategoryModel.findById).mockResolvedValue(sampleCategory);
            vi.mocked(CategoryModel.findByKey).mockResolvedValue({ ...sampleCategory, Category_ID: 99 });

            await expect(CategoryService.update(1, { category_key: 'taken-key' })).rejects.toThrow('Category key already exists');
        });

        it('should throw 500 when update fails', async () => {
            vi.mocked(CategoryModel.findById).mockResolvedValue(sampleCategory);
            vi.mocked(CategoryModel.findByKey).mockResolvedValue(null);
            vi.mocked(CategoryModel.update).mockResolvedValue(false);

            await expect(CategoryService.update(1, { name: 'Updated' })).rejects.toThrow('Failed to update category');
        });

        it('should update category successfully', async () => {
            vi.mocked(CategoryModel.findById)
                .mockResolvedValueOnce(sampleCategory)
                .mockResolvedValueOnce({ ...sampleCategory, name: 'Updated Phones' });
            vi.mocked(CategoryModel.update).mockResolvedValue(true);

            const result = await CategoryService.update(1, { name: 'Updated Phones' });
            expect(result?.name).toBe('Updated Phones');
        });

        it('should skip key uniqueness check when key is unchanged', async () => {
            vi.mocked(CategoryModel.findById)
                .mockResolvedValueOnce(sampleCategory)
                .mockResolvedValueOnce(sampleCategory);
            vi.mocked(CategoryModel.update).mockResolvedValue(true);

            await CategoryService.update(1, { category_key: 'phones', name: 'Updated' });
            expect(CategoryModel.findByKey).not.toHaveBeenCalled();
        });
    });

    // ===== delete =====
    describe('delete', () => {
        it('should throw 404 when category not found', async () => {
            vi.mocked(CategoryModel.findById).mockResolvedValue(null);

            await expect(CategoryService.delete(999)).rejects.toThrow('Category not found');
        });

        it('should throw 500 when delete fails', async () => {
            vi.mocked(CategoryModel.findById).mockResolvedValue(sampleCategory);
            vi.mocked(CategoryModel.delete).mockResolvedValue(false);

            await expect(CategoryService.delete(1)).rejects.toThrow('Failed to delete category');
        });

        it('should delete category successfully', async () => {
            vi.mocked(CategoryModel.findById).mockResolvedValue(sampleCategory);
            vi.mocked(CategoryModel.delete).mockResolvedValue(true);

            const result = await CategoryService.delete(1);
            expect(result).toEqual({ message: 'Category deleted successfully' });
        });
    });
});
