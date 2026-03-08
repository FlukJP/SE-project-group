import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '@/src/services/product.service';
import { ProductModel } from '@/src/models/productModel';
import { AppError } from '@/src/errors/AppError';

vi.mock('@/src/models/productModel');
vi.mock('@/src/services/category.service', () => ({
    CategoryService: {
        recordPopularity: vi.fn(async () => {}),
    },
}));
vi.mock('@/src/utils/uploadHelpers', () => ({
    cleanupImages: vi.fn(),
    deleteUploadedFile: vi.fn(),
}));

const sampleProduct = {
    Product_ID: 1,
    Seller_ID: 10,
    Title: 'Test Product',
    Description: 'Test description',
    Price: 100,
    Condition: 'new',
    Category_ID: 1,
    Status: 'available' as const,
    Quantity: 5,
    Image_URL: '["img1.jpg"]',
    Is_Banned: false,
};

describe('ProductService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // ===== getProductByID =====
    describe('getProductByID', () => {
        it('should return product when found', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(sampleProduct as any);
            const result = await ProductService.getProductByID(1);
            expect(result).toEqual(sampleProduct);
        });

        it('should throw 404 when product not found', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(null);
            await expect(ProductService.getProductByID(999)).rejects.toThrow('Product not found');
        });
    });

    // ===== getProductsBySeller =====
    describe('getProductsBySeller', () => {
        it('should throw on invalid seller ID', async () => {
            await expect(ProductService.getProductsBySeller(0)).rejects.toThrow('Invalid seller ID');
            await expect(ProductService.getProductsBySeller(-1)).rejects.toThrow('Invalid seller ID');
        });

        it('should return products for valid seller', async () => {
            vi.mocked(ProductModel.findBySellerID).mockResolvedValue([sampleProduct] as any);
            const result = await ProductService.getProductsBySeller(10);
            expect(result).toHaveLength(1);
        });
    });

    // ===== createProduct =====
    describe('createProduct', () => {
        it('should throw when required fields are missing', async () => {
            await expect(
                ProductService.createProduct(10, {
                    Title: '',
                    Description: 'desc',
                    Price: 100,
                    Condition: 'new',
                    Category_ID: 1,
                    Image_URL: '["img.jpg"]',
                    Seller_ID: 10,
                    Status: 'available',
                    Quantity: 1,
                })
            ).rejects.toThrow('Missing required fields');
        });

        it('should throw when price is zero or negative', async () => {
            await expect(
                ProductService.createProduct(10, {
                    Title: 'Test',
                    Description: 'desc',
                    Price: -5,
                    Condition: 'new',
                    Category_ID: 1,
                    Image_URL: '["img.jpg"]',
                    Seller_ID: 10,
                    Status: 'available',
                    Quantity: 1,
                })
            ).rejects.toThrow('Price must be greater than 0');
        });

        it('should throw when title exceeds 255 characters', async () => {
            await expect(
                ProductService.createProduct(10, {
                    Title: 'A'.repeat(256),
                    Description: 'desc',
                    Price: 100,
                    Condition: 'new',
                    Category_ID: 1,
                    Image_URL: '["img.jpg"]',
                    Seller_ID: 10,
                    Status: 'available',
                    Quantity: 1,
                })
            ).rejects.toThrow('Title must be less than 255 characters');
        });

        it('should throw when Image_URL is not a valid JSON array', async () => {
            await expect(
                ProductService.createProduct(10, {
                    Title: 'Test',
                    Description: 'desc',
                    Price: 100,
                    Condition: 'new',
                    Category_ID: 1,
                    Image_URL: 'not-json',
                    Seller_ID: 10,
                    Status: 'available',
                    Quantity: 1,
                })
            ).rejects.toThrow('Image_URL must be a valid JSON array');
        });

        it('should create product successfully', async () => {
            vi.mocked(ProductModel.createProduct).mockResolvedValue(99);

            const result = await ProductService.createProduct(10, {
                Title: 'Test Product',
                Description: 'A description',
                Price: 299,
                Condition: 'new',
                Category_ID: 1,
                Image_URL: '["img.jpg"]',
                Seller_ID: 10,
                Status: 'available',
                Quantity: 2,
            });

            expect(result).toBe(99);
            expect(ProductModel.createProduct).toHaveBeenCalledTimes(1);
        });
    });

    // ===== updateProduct =====
    describe('updateProduct', () => {
        it('should throw 404 when product not found', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(null);
            await expect(ProductService.updateProduct(999, 10, { Title: 'New' })).rejects.toThrow('Product not found');
        });

        it('should throw 403 when user is not the owner and not admin', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(sampleProduct as any);
            await expect(ProductService.updateProduct(1, 999, { Title: 'New' }, false)).rejects.toThrow('Forbidden');
        });

        it('should allow admin to update any product', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(sampleProduct as any);
            vi.mocked(ProductModel.updateProduct).mockResolvedValue(true);

            const result = await ProductService.updateProduct(1, 999, { Title: 'Admin Update' }, true);
            expect(result.updated).toBe(true);
        });

        it('should throw when price is zero', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(sampleProduct as any);
            await expect(ProductService.updateProduct(1, 10, { Price: 0 })).rejects.toThrow('Price must be greater than 0');
        });
    });

    // ===== deleteProduct =====
    describe('deleteProduct', () => {
        it('should throw 404 when product not found', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(null);
            await expect(ProductService.deleteProduct(999, 10)).rejects.toThrow('Product not found');
        });

        it('should throw 403 when user is not owner and not admin', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(sampleProduct as any);
            await expect(ProductService.deleteProduct(1, 999, false)).rejects.toThrow('Forbidden');
        });

        it('should delete successfully for the owner', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(sampleProduct as any);
            vi.mocked(ProductModel.deleteProduct).mockResolvedValue(true);

            const result = await ProductService.deleteProduct(1, 10);
            expect(result).toBe(true);
        });
    });
});
