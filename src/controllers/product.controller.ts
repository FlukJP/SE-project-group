import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { deleteUploadedFile, cleanupImages } from '../utils/uploadHelpers';
import { UploadFolderType } from '../types/upload';
import { ProductService } from '../services/product.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { Product } from '../types/Product';

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

            const numQuantity = quantity ? Number(quantity) : 1;
            if (isNaN(numQuantity) || numQuantity <= 0) throw new AppError("Quantity must be a positive integer", 400);

            if (!files || files.length === 0) throw new AppError("At least one image is required", 400);

            // P-9: Reorder images so coverIndex image is first
            const coverIdx = req.body.coverIndex != null ? Number(req.body.coverIndex) : 0;
            const orderedFiles = [...files];
            if (coverIdx > 0 && coverIdx < orderedFiles.length) {
                const [cover] = orderedFiles.splice(coverIdx, 1);
                orderedFiles.unshift(cover);
            }
            const imageUrls = orderedFiles.map(file => `/uploads/products/${file.filename}`);

            const fullDescription = `${description ? description.trim() : ''}\n\n📍 พื้นที่: ${province.trim()} (${district.trim()})\n📞 ติดต่อ: ${phone.trim()}`;

            const newProductData: Omit<Product, 'Product_ID'> = {
                Seller_ID: req.user.userID,
                Title: title.trim(),
                Description: fullDescription,
                Price: numPrice,
                Condition: condition?.trim() || "มือสอง",
                Category: categoryKey.trim(),
                Status: "available",
                Quantity: numQuantity,
                Image_URL: JSON.stringify(imageUrls),
            };

            const insertId = await ProductService.createProduct(req.user.userID, newProductData);

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
            const result = await ProductService.getAllProducts({
                keyword: q as string,
                category: category as string,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                limit: limit ? Number(limit) : 20,
                page: page ? Number(page) : 1,
                sortBy: (sortBy === 'Price' || sortBy === 'Created_at') ? sortBy : undefined,
                sortOrder: sortOrder as 'asc' | 'desc'
            });

            res.status(200).json({ success: true, data: result.products, meta: { page: page ? Number(page) : 1, limit: limit ? Number(limit) : 20, total: result.total } });
        } catch (error) {
            next(error);
        }
    },

    // 3.ดูรายละเอียดสินค้า (Get by ID)
    getProductByID: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const productId = Number(req.params.id);
            const product = await ProductService.getProductByID(productId);

            res.status(200).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    },

    // 4.ดูสินค้าของผู้ขาย (Get by Seller)
    getProductsBySeller: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const sellerId = Number(req.params.sellerId);
            const products = await ProductService.getProductsBySeller(sellerId);
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
            const isAdmin = req.user.role === 'admin';

            const updateData: Partial<Product> = { ...req.body };
            if (files && files.length > 0) {
                const imageUrls = files.map(file => `/uploads/products/${file.filename}`);
                updateData.Image_URL = JSON.stringify(imageUrls);
            }

            const result = await ProductService.updateProduct(productId, req.user.userID, updateData, isAdmin);

            // Cleanup old images only after successful update
            if (files && files.length > 0 && result.oldImageURL) {
                cleanupImages(result.oldImageURL);
            }

            res.status(200).json({ success: true, message: "Product updated successfully" });
        } catch (error) {
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
            const isAdmin = req.user.role === 'admin';

            await ProductService.deleteProduct(productId, req.user.userID, isAdmin);

            res.status(200).json({ success: true, message: "Product deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
};
