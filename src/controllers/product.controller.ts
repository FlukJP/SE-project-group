import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { uploadToStorage, deleteStorageImages, generateUniqueFilename } from '../services/storage.Service';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { Product, pickProductUpdateFields } from '../types/Product';

export const ProductController = {
    /** Parse and validate the multipart form, reorder images by coverIndex, then create a new product listing */
    createProduct: async (req: AuthRequest, res: Response, next: NextFunction) => {
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

            const files = req.files as Express.Multer.File[] | undefined;
            if (!files || files.length === 0) throw new AppError("At least one image is required", 400);

            // Reorder images so the coverIndex image is first
            const coverIdx = req.body.coverIndex != null ? Number(req.body.coverIndex) : 0;
            const orderedFiles = [...files];
            if (coverIdx > 0 && coverIdx < orderedFiles.length) {
                const [cover] = orderedFiles.splice(coverIdx, 1);
                orderedFiles.unshift(cover);
            }

            const imageUrls = await Promise.all(
                orderedFiles.map(file =>
                    uploadToStorage(file.buffer, file.mimetype, 'products', generateUniqueFilename('product', file.mimetype))
                )
            );

            const fullDescription = description ? description.trim() : '';
            const category = await CategoryService.getByKey(categoryKey.trim());

            const newProductData: Omit<Product, 'Product_ID'> = {
                Seller_ID: req.user.userID,
                Title: title.trim(),
                Description: fullDescription,
                Province: province.trim(),
                District: district.trim(),
                Price: numPrice,
                Condition: condition?.trim() || "used",
                Category_ID: category.Category_ID,
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
            next(error);
        }
    },

    /** Search or list products using query parameters (keyword, category, price range, location, sort, pagination) */
    getAllProducts: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { q, category, minPrice, maxPrice, limit, page, sortBy, sortOrder, province, district, excludeSeller } = req.query;

            const result = await ProductService.getAllProducts({
                keyword: q as string,
                category: category as string,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                limit: limit ? Number(limit) : 20,
                page: page ? Number(page) : 1,
                sortBy: (sortBy === 'Price' || sortBy === 'Created_at' || sortBy === 'random') ? sortBy : undefined,
                sortOrder: sortOrder as 'asc' | 'desc',
                province: province as string | undefined,
                district: district as string | undefined,
                excludeSeller: excludeSeller ? Number(excludeSeller) : undefined,
            });

            res.status(200).json({ success: true, data: result.products, meta: { page: page ? Number(page) : 1, limit: limit ? Number(limit) : 20, total: result.total } });
        } catch (error) {
            next(error);
        }
    },

    /** Retrieve the details of a single product by its ID */
    getProductByID: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const productId = Number(req.params.id);
            const product = await ProductService.getProductByID(productId);

            res.status(200).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    },

    /** Retrieve all products listed by a specific seller ID */
    getProductsBySeller: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const sellerId = Number(req.params.sellerId);
            const products = await ProductService.getProductsBySeller(sellerId);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    },

    /** Update product fields; if new images are uploaded, replace existing images and delete old ones from storage */
    updateProduct: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized", 401);

            const productId = Number(req.params.id);
            const isAdmin = req.user.role === 'admin';
            const files = req.files as Express.Multer.File[] | undefined;

            const rawBody = { ...req.body };
            if (rawBody.province) rawBody.Province = String(rawBody.province).trim();
            if (rawBody.district) rawBody.District = String(rawBody.district).trim();
            const updateData = pickProductUpdateFields(rawBody);

            if (files && files.length > 0) {
                const imageUrls = await Promise.all(
                    files.map(file =>
                        uploadToStorage(file.buffer, file.mimetype, 'products', generateUniqueFilename('product', file.mimetype))
                    )
                );
                updateData.Image_URL = JSON.stringify(imageUrls);
            }

            const result = await ProductService.updateProduct(productId, req.user.userID, updateData, isAdmin);

            if (files && files.length > 0 && result.oldImageURL) {
                deleteStorageImages(result.oldImageURL).catch(() => {});
            }

            res.status(200).json({ success: true, message: "Product updated successfully" });
        } catch (error) {
            next(error);
        }
    },

    /** Delete a product by ID; admin users may delete any product regardless of ownership */
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
