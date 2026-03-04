import { Product } from "@/types/Product";
import { ProductModel } from "@/models/productModel";
import { AppError } from "@/errors/AppError";
import { Filter } from "firebase-admin/firestore";

export const ProductService = {
    // 1.Create product
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
    // 2.Product list
    // 3.Product by seller
    // 4.Product detail
    // 5.search product
    // 6.Change product status
    // 7.Update product
    // 8.Delete product
    // 9.Report product
    // 10.Upload product image
    // 11.Remove product image
    // 12.GET categories
};