import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { deleteUploadedFile, cleanupImages } from '../utils/uploadHelpers';
import { UploadFolderType } from '../types/upload';
import { ProductModel } from '../models/productModel';
import { AuthRequest } from '../middleware/auth.middleware';
import { Product, pickProductUpdateFields } from '../types/Product';

export const ProductController = {
    // 1.สร้างสินค้าใหม่ (Create)
    createProduct: async (req: AuthRequest, res: Response, next: NextFunction) => {
        const files = req.files as Express.Multer.File[] | undefined;
        try {
            if (!req.user) throw new AppError("Unauthorized: Please login first", 401);
            const { title, price, description, categoryKey, province, district, phone, condition, quantity } = req.body;

            if (!title?.trim() || !price || !categoryKey?.trim() || !province?.trim() || !district?.trim() || !phone?.trim()) {
                throw new AppError("All fields are required", 400);
            }

            const numPrice = Number(price);
            if (isNaN(numPrice) || numPrice <= 0) throw new AppError("Price must be a positive number", 400);

            if (!files || files.length === 0) throw new AppError("At least one image is required", 400);
            const imageUrls = files.map(file => `/uploads/products/${file.filename}`);

            const fullDescription = `${description ? description.trim() : ''}\n\n📍 พื้นที่: ${province.trim()} (${district.trim()})\n📞 ติดต่อ: ${phone.trim()}`;

            const newProductData: Omit<Product, 'Product_ID'> = {
                Seller_ID: req.user.userID,
                Title: title.trim(),
                Description: fullDescription,
                Price: numPrice,
                Condition: condition?.trim() || "มือสอง",
                Category: categoryKey.trim(),
                Status: "available",
                Quantity: quantity ? Number(quantity) : 1,
                Image_URL: JSON.stringify(imageUrls),
            };

            const insertId = await ProductModel.createProduct(newProductData as Product);

            res.status(201).json({
                success: true,
                message: "Product created successfully",
                product: { ...newProductData, Product_ID: insertId }
            });
        } catch (error) {
            if (files && files.length > 0) {
                files.forEach(file => {
                    deleteUploadedFile(file.filename, UploadFolderType.PRODUCT);
                });
            }
            next(error);
        }
    },

    // 2.ค้นหาสินค้า (Search/List)
    getAllProducts: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { q, category, minPrice, maxPrice, limit, page, sortBy, sortOrder } = req.query;
            const products = await ProductModel.searchProducts({
                keyword: q as string,
                category: category as string,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                limit: limit ? Number(limit) : 20,
                page: page ? Number(page) : 1,
                sortBy: (sortBy === 'Price' || sortBy === 'Created_at') ? sortBy : undefined,
                sortOrder: sortOrder as 'asc' | 'desc'
            });

            res.status(200).json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    },

    // 3.ดูรายละเอียดสินค้า (Get by ID)
    getProductByID: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const productId = Number(req.params.id);
            const product = await ProductModel.findByID(productId);
            if (!product) throw new AppError("Product not found", 404);

            res.status(200).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    },

    // 4.ดูสินค้าของผู้ขาย (Get by Seller)
    getProductsBySeller: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const sellerId = Number(req.params.sellerId);
            if (!sellerId || sellerId <= 0) throw new AppError("Invalid seller ID", 400);

            const products = await ProductModel.findBySellerID(sellerId);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    },

    // 5.แก้ไขสินค้า (Update)
    updateProduct: async (req: AuthRequest, res: Response, next: NextFunction) => {
        const files = req.files as Express.Multer.File[] | undefined;
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const productId = Number(req.params.id);
            const product = await ProductModel.findByID(productId);
            if (!product) throw new AppError("Product not found", 404);
            if (product.Seller_ID !== req.user.userID && req.user.role !== 'admin') {
                throw new AppError("Forbidden: You are not the owner of this product", 403);
            }

            const updateData = pickProductUpdateFields(req.body);
            let oldImagesToCleanup: string | undefined;
            if (files && files.length > 0) {
                oldImagesToCleanup = product.Image_URL;
                const imageUrls = files.map(file => `/uploads/products/${file.filename}`);
                updateData.Image_URL = JSON.stringify(imageUrls);
            }
            if (Object.keys(updateData).length === 0) throw new AppError("No fields to update", 400);
            const updated = await ProductModel.updateProduct(productId, updateData);
            if (!updated) throw new AppError("Failed to update product", 500);
            if (oldImagesToCleanup) cleanupImages(oldImagesToCleanup);

            res.status(200).json({ success: true, message: "Product updated successfully" });
        } catch (error) {
            // ลบรูปใหม่ที่ upload มาถ้า update ล้มเหลว
            if (files && files.length > 0) {
                files.forEach(file => {
                    deleteUploadedFile(file.filename, UploadFolderType.PRODUCT);
                });
            }
            next(error);
        }
    },

    // 6.ลบสินค้า (Delete)
    deleteProduct: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const productId = Number(req.params.id);
            const product = await ProductModel.findByID(productId);
            if (!product) throw new AppError("Product not found", 404);
            if (product.Seller_ID !== req.user.userID && req.user.role !== 'admin') {
                throw new AppError("Forbidden: You are not the owner of this product", 403);
            }

            if (product.Image_URL) cleanupImages(product.Image_URL);
            await ProductModel.deleteProduct(productId);

            res.status(200).json({ success: true, message: "Product deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
};