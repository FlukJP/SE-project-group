import { Product, ProductFilters, pickProductUpdateFields } from "@/src/types/Product";
import { ProductModel } from "@/src/models/productModel";
import { AppError } from "@/src/errors/AppError";
import { CategoryService } from "@/src/services/category.service";
import { cleanupImages } from "@/src/utils/uploadHelpers";

export const ProductService = {
    // 1.Product list
    getAllProducts: async (filters: ProductFilters = {}) => {
        const result = await ProductModel.searchProducts(filters);

        if (filters.category) {
            CategoryService.recordPopularity(filters.category, 'search').catch(() => {});
        }

        return result;
    },

    // 2.Product by seller
    getProductsBySeller: async (sellerID: number) => {
        if (!sellerID || sellerID <= 0) throw new AppError("Invalid seller ID", 400);
        return await ProductModel.findBySellerID(sellerID);
    },

    // 3.Product detail
    getProductByID: async (productID: number) => {
        const product = await ProductModel.findByID(productID);
        if (!product) throw new AppError("Product not found", 404);
        return product;
    },

    // 4.Create product
    createProduct: async (sellerID: number, productData: Omit<Product, 'Product_ID'>) => {
        if (!productData.Title || !productData.Description || !productData.Price || !productData.Condition || !productData.Category || !productData.Image_URL) {
            throw new AppError("Missing required fields", 400);
        }
        if (productData.Price <= 0) throw new AppError("Price must be greater than 0", 400);
        if (productData.Quantity !== undefined && productData.Quantity <= 0) throw new AppError("Quantity must be greater than 0", 400);
        if (productData.Title.trim().length > 255) throw new AppError("Title must be less than 255 characters", 400);
        if (productData.Description.trim().length > 2000) throw new AppError("Description must be less than 2000 characters", 400);

        // Validate Image_URL is valid JSON array
        try {
            const parsed = JSON.parse(productData.Image_URL);
            if (!Array.isArray(parsed)) throw new Error();
        } catch {
            throw new AppError("Image_URL must be a valid JSON array", 400);
        }

        const newProduct: Product = {
            Title: productData.Title.trim(),
            Description: productData.Description.trim(),
            Price: productData.Price,
            Condition: productData.Condition,
            Category: productData.Category,
            Image_URL: productData.Image_URL,
            Quantity: productData.Quantity || 1,
            Seller_ID: sellerID,
            Status: 'available',
        };
        return await ProductModel.createProduct(newProduct as Product);
    },

    // 5.Update product (with admin override support)
    updateProduct: async (productID: number, userID: number, updateData: Partial<Product>, isAdmin: boolean = false) => {
        const product = await ProductModel.findByID(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Seller_ID !== userID && !isAdmin) throw new AppError("Forbidden: You are not the owner of this product", 403);

        const safeData = pickProductUpdateFields(updateData);
        if (Object.keys(safeData).length === 0) throw new AppError("No valid fields to update", 400);

        if (safeData.Price !== undefined && safeData.Price <= 0) throw new AppError("Price must be greater than 0", 400);
        if (safeData.Quantity !== undefined && safeData.Quantity <= 0) throw new AppError("Quantity must be greater than 0", 400);
        if (safeData.Title !== undefined) {
            safeData.Title = safeData.Title.trim();
            if (safeData.Title.length > 255) throw new AppError("Title must be less than 255 characters", 400);
        }
        if (safeData.Description !== undefined) {
            safeData.Description = safeData.Description.trim();
            if (safeData.Description.length > 2000) throw new AppError("Description must be less than 2000 characters", 400);
        }

        const updated = await ProductModel.updateProduct(productID, safeData);
        if (!updated) throw new AppError("Failed to update product", 500);

        return { updated, oldImageURL: product.Image_URL };
    },

    // 6.Delete product (with admin override support)
    deleteProduct: async (productID: number, userID: number, isAdmin: boolean = false) => {
        const product = await ProductModel.findByID(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Seller_ID !== userID && !isAdmin) throw new AppError("Forbidden: You are not the owner of this product", 403);

        if (product.Image_URL) cleanupImages(product.Image_URL);
        return await ProductModel.deleteProduct(productID);
    }
};
