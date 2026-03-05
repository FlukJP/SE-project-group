import { Product , ProductFilters } from "@/types/Product";
import { ProductModel } from "@/models/productModel";
import { AppError } from "@/errors/AppError";
import fsPromises from 'fs/promises';
import path from 'path';

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
        
        const newProduct: Product = {
            Title: productData.Title,
            Description: productData.Description,
            Price: productData.Price,
            Condition: productData.Condition,
            Category: productData.Category,
            Image_URL: productData.Image_URL,
            Quantity: productData.Quantity,
            Seller_ID: sellerID,
            Status: 'Available',
        };
        return await ProductModel.createProduct(newProduct as Product);
    },

    // 5.Update product
    updateProduct: async ( productID: number, sellerID: number, updateData: Partial<Product>) => {
        const product = await ProductModel.findByID(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Seller_ID !== sellerID) throw new AppError("Unauthorized to update this product", 403);
        if (updateData.Price !== undefined && updateData.Price <= 0) throw new AppError("Price must be greater than 0", 400);
        if (updateData.Quantity !== undefined && updateData.Quantity <= 0) throw new AppError("Quantity must be greater than 0", 400);

        if (updateData.Image_URL && updateData.Image_URL !== product.Image_URL) {
            try {
                const oldImagePath = path.join(process.cwd(), 'public', product.Image_URL);
                await fsPromises.unlink(oldImagePath);
            } catch (err: any) {
                if (err.code !== 'ENOENT') console.error(`Failed to delete old image: ${product.Image_URL}`, err);
            }
        }
        return await ProductModel.updateProduct(productID, updateData);
    },

    // 6.Delete product
    deleteProduct: async (productID: number, sellerID: number) => {
        const product = await ProductModel.findByID(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Seller_ID !== sellerID) throw new AppError("Unauthorized to delete this product", 403);
        if (product.Image_URL) {
            try {
                const imagePath = path.join(process.cwd(), 'public', product.Image_URL);
                await fsPromises.unlink(imagePath);
            } catch (err: any) {
                if (err.code !== 'ENOENT') console.error(`Failed to delete image for product ${productID}:`, err);
            }
        }
        return await ProductModel.deleteProduct(productID);
    }
};