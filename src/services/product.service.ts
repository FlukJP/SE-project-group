import { Product , ProductFilters , UpdateProductData } from "@/src/types/Product";
import { ProductModel } from "@/src/models/productModel";
import { AppError } from "@/src/errors/AppError";
import fsPromises from 'fs/promises';
import path from 'path';
import { pickFields } from "@/src/utils/objectUtils"

export const ProductService = {
    // 1.Product list
    getAllProducts: async (filters: ProductFilters = {} ) => {
        return await ProductModel.searchProducts(filters);
    },

    // 2.Product by seller
    getProductsBySeller: async (sellerID: number) => {
        return await ProductModel.findBySellerID(sellerID);
    },

    // 3.Product detail
    getProductByID: async (productID: number) => {
        const product = await ProductModel.findByID(productID);
        if (!product) throw new AppError("Product not found", 404);
        return product;
    }, 

    // 4.Create product
    createProduct: async (sellerID: number, productData: Product) => {
        if (!productData.Title || !productData.Description || !productData.Price || !productData.Condition || !productData.Category || !productData.Image_URL || !productData.Quantity) throw new AppError("Missing required fields", 400);
        if (productData.Price <= 0) throw new AppError("Price must be greater than 0", 400);
        if (productData.Quantity <= 0) throw new AppError("Quantity must be greater than 0", 400);
        if (productData.Title.trim().length > 255) throw new AppError("Title must be less than 255 characters", 400);
        if (productData.Description.trim().length > 2000) throw new AppError("Description must be less than 2000 characters", 400);
        if (productData.Image_URL.includes('..') || productData.Image_URL.startsWith('/')) throw new AppError("Invalid image URL", 400);

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
            Quantity: productData.Quantity,
            Seller_ID: sellerID,
            Status: 'available',
        };
        return await ProductModel.createProduct(newProduct as Product);
    },

    // 5.Update product
    updateProduct: async ( productID: number, sellerID: number, updateData: Partial<Product>) => {
        const product = await ProductModel.findByID(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Seller_ID !== sellerID) throw new AppError("Unauthorized to update this product", 403);
        const safeData = pickFields<Product, keyof UpdateProductData>(updateData, [
            "Title",
            "Description",
            "Price",
            "Condition",
            "Category",
            "Quantity",
            "Image_URL",
            "Status"
        ]);

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

        if (safeData.Image_URL && safeData.Image_URL !== product.Image_URL) {
            if (safeData.Image_URL.includes('..') || safeData.Image_URL.startsWith('/')) throw new AppError("Invalid image URL", 400);
            try {
                const oldImagePath = path.join(process.cwd(), 'public', product.Image_URL);
                await fsPromises.unlink(oldImagePath);
            } catch (err: any) {
                if (err.code !== 'ENOENT') console.error(`Failed to delete old image: ${product.Image_URL}`, err);
            }
        }
        return await ProductModel.updateProduct(productID, safeData);
    },

    // 6.Delete product
    deleteProduct: async (productID: number, sellerID: number) => {
        const product = await ProductModel.findByID(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Seller_ID !== sellerID) throw new AppError("Unauthorized to delete this product", 403);
        if (product.Image_URL) {
            if (!product.Image_URL.includes('..') && !product.Image_URL.startsWith('/')) {
                try {
                    const imagePath = path.join(process.cwd(), 'public', product.Image_URL);
                    await fsPromises.unlink(imagePath);
                } catch (err: any) {
                    if (err.code !== 'ENOENT') console.error(`Failed to delete image for product ${productID}:`, err);
                }
            }
        }
        return await ProductModel.deleteProduct(productID);
    }
};