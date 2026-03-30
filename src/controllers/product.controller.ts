import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { uploadToStorage, deleteStorageImages, generateUniqueFilename } from '../services/storage.service';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { Product, pickProductUpdateFields } from '../types/Product';
import { UserModel } from '../models/UserModel';

const PRODUCT_PHONE_SUFFIX_PATTERN = /\n\nPHONE:\s*[\s\S]*$/;
const PRICE_DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

const buildStoredDescription = (description: unknown, phone: unknown): string => {
    const baseDescription = typeof description === 'string'
        ? description.replace(PRODUCT_PHONE_SUFFIX_PATTERN, '').trim()
        : '';
    const phoneValue = typeof phone === 'string' ? phone.trim() : '';

    if (!phoneValue) return baseDescription;
    return `${baseDescription}${baseDescription ? '\n\n' : ''}PHONE: ${phoneValue}`;
};

const parseImageUrlList = (imageUrlJson: unknown): string[] => {
    if (typeof imageUrlJson !== 'string' || !imageUrlJson.trim()) return [];

    try {
        const parsed = JSON.parse(imageUrlJson);
        return Array.isArray(parsed) ? parsed.filter((url): url is string => typeof url === 'string' && !!url.trim()) : [];
    } catch {
        return imageUrlJson.trim() ? [imageUrlJson.trim()] : [];
    }
};

const isValidPriceValue = (value: unknown): value is string | number => {
    const normalized = typeof value === 'number'
        ? value.toString()
        : typeof value === 'string'
            ? value.trim()
            : '';

    return PRICE_DECIMAL_PATTERN.test(normalized) && Number(normalized) > 0;
};

export const ProductController = {
    /** Parse and validate the multipart form, reorder images by coverIndex, then create a new product listing */
    createProduct: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError("Unauthorized: Please login first", 401);
            const { title, price, description, categoryKey, province, district, phone, condition, quantity } = req.body;

            if (!title?.trim() || !price || !categoryKey?.trim() || !province?.trim() || !district?.trim() || !phone?.trim()) {
                throw new AppError("All fields are required", 400);
            }

            const seller = await UserModel.findByIDSafe(req.user.userID);
            if (!seller) throw new AppError("Seller not found", 404);
            if (!seller.Phone_number?.trim()) {
                throw new AppError("Please add your phone number to your profile before creating a product.", 400);
            }

            if (!isValidPriceValue(price)) throw new AppError("Price must be a positive number with up to 2 decimal places", 400);
            const numPrice = Number(price);

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

            const fullDescription = buildStoredDescription(description, seller.Phone_number);
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

            const rawBody = { ...req.body } as Record<string, unknown>;
            const seller = await UserModel.findByIDSafe(req.user.userID);
            if (!seller) throw new AppError("Seller not found", 404);
            if (!seller.Phone_number?.trim()) {
                throw new AppError("Please add your phone number to your profile before updating a product.", 400);
            }
            if (rawBody.title !== undefined) rawBody.Title = String(rawBody.title);
            if (rawBody.price !== undefined) {
                if (!isValidPriceValue(rawBody.price)) {
                    throw new AppError("Price must be a positive number with up to 2 decimal places", 400);
                }
                rawBody.Price = Number(rawBody.price);
            }
            if (rawBody.description !== undefined || rawBody.phone !== undefined) {
                rawBody.Description = buildStoredDescription(rawBody.description, seller.Phone_number);
            }
            if (rawBody.condition !== undefined) rawBody.Condition = String(rawBody.condition).trim();
            if (rawBody.quantity !== undefined) rawBody.Quantity = Number(rawBody.quantity);
            if (rawBody.status !== undefined) rawBody.Status = String(rawBody.status).trim();
            if (rawBody.province) rawBody.Province = String(rawBody.province).trim();
            if (rawBody.district) rawBody.District = String(rawBody.district).trim();

            if (typeof rawBody.categoryKey === 'string' && rawBody.categoryKey.trim()) {
                const category = await CategoryService.getByKey(rawBody.categoryKey.trim());
                rawBody.Category_ID = category.Category_ID;
            }

            const updateData = pickProductUpdateFields(rawBody);
            const retainedImageUrls = parseImageUrlList(rawBody.Image_URL);

            if (files && files.length > 0) {
                const imageUrls = await Promise.all(
                    files.map(file =>
                        uploadToStorage(file.buffer, file.mimetype, 'products', generateUniqueFilename('product', file.mimetype))
                    )
                );
                updateData.Image_URL = JSON.stringify([...retainedImageUrls, ...imageUrls]);
            }

            const result = await ProductService.updateProduct(productId, req.user.userID, updateData, isAdmin);

            if (result.oldImageURL && updateData.Image_URL !== undefined) {
                const oldImageUrls = parseImageUrlList(result.oldImageURL);
                const nextImageUrls = parseImageUrlList(updateData.Image_URL);
                const removedImageUrls = oldImageUrls.filter((url) => !nextImageUrls.includes(url));

                if (removedImageUrls.length > 0) {
                    deleteStorageImages(JSON.stringify(removedImageUrls)).catch(() => {});
                }
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
