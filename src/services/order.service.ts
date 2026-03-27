import { Order } from "@/src/types/Order";
import { OrderModel } from "@/src/models/orderModel";
import { AppError } from "@/src/errors/AppError";
import { ProductModel } from "@/src/models/productModel";
import { CategoryService } from "@/src/services/category.service";

export const OrderService = {
    /** Validate stock, compute total price, atomically create the order and update product quantity, then record category popularity */
    createOrder: async (buyerID: number, orderData: { Product_ID: number; Quantity: number }): Promise<number> => {
        if (!orderData.Product_ID || !orderData.Quantity) throw new AppError("Missing required fields", 400);
        if (orderData.Quantity <= 0) throw new AppError("Quantity must be greater than 0", 400);

        const product = await ProductModel.findByID(orderData.Product_ID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Seller_ID === buyerID) throw new AppError("Cannot order your own product", 400);

        const currentQuantity = product.Quantity || 0;
        if (currentQuantity < orderData.Quantity) throw new AppError("Not enough stock available", 400);
        
        const totalPrice = product.Price * orderData.Quantity;

        const newOrder: Order = {
            Product_ID: orderData.Product_ID,
            Buyer_ID: buyerID,
            Seller_ID: product.Seller_ID,
            Quantity: orderData.Quantity,
            Total_Price: totalPrice,
            Status: 'pending',
        };

        const orderID = await OrderModel.createOrderTransaction(newOrder, product.Product_ID!);

        if (product.Category_Key) {
            CategoryService.recordPopularity(product.Category_Key, 'purchase').catch(() => {});
        }

        return orderID;
    },

    /** Retrieve a single order by ID, verifying the user is the buyer or seller */
    getOrderByID: async (orderID: number, userID: number): Promise<Order> => {
        if (!orderID) throw new AppError("Order ID is required", 400);
        const order = await OrderModel.findByID(orderID);
        if (!order) throw new AppError("Order not found", 404);
        if (userID !== order.Buyer_ID && userID !== order.Seller_ID) throw new AppError("Unauthorized to view this order", 403);
        return order;
    },

    /** Retrieve all orders placed by a specific buyer */
    getOrderByBuyerID: async (buyerID: number): Promise<Order[]> => {
        if (!buyerID) throw new AppError("Buyer ID is required", 400);
        const orders = await OrderModel.findByBuyerID(buyerID);
        return orders || [];
    },

    /** Retrieve all orders received by a specific seller */
    getOrderBySellerID: async (sellerID: number): Promise<Order[]> => {
        if (!sellerID) throw new AppError("Seller ID is required", 400);
        const orders = await OrderModel.findBySellerID(sellerID);
        return orders || [];
    },

    /** Advance the order status following allowed transitions: buyer marks pending→paid, seller marks paid→completed */
    updateOrderStatus: async (orderID: number, userID: number, newStatus: 'paid' | 'completed'): Promise<boolean> => {
        if (!orderID || !newStatus) throw new AppError("Order ID and new status are required", 400);

        const order = await OrderModel.findByID(orderID);
        if (!order) throw new AppError("Order not found", 404);
        if (userID !== order.Buyer_ID && userID !== order.Seller_ID) throw new AppError("Unauthorized to update this order", 403);
        if (order.Status === 'cancelled' || order.Status === 'completed') throw new AppError("Cannot update a cancelled or completed order", 400);

        if (userID === order.Buyer_ID && newStatus === 'paid' && order.Status === 'pending') {
            return await OrderModel.updateOrder(orderID, newStatus);
        }
        if (userID === order.Seller_ID && newStatus === 'completed' && order.Status === 'paid') {
            return await OrderModel.updateOrder(orderID, newStatus);
        }
        throw new AppError("Invalid status transition or permission denied", 400);
    },

    /** Cancel an order and restore product stock atomically; falls back to a simple status update if the product no longer exists */
    cancelOrder: async (orderID: number, userID: number): Promise<boolean> => {
        if (!orderID) throw new AppError("Order ID is required", 400);

        const order = await OrderModel.findByID(orderID);
        if (!order) throw new AppError("Order not found", 404);
        if (userID !== order.Buyer_ID && userID !== order.Seller_ID) throw new AppError("Unauthorized to cancel this order", 403);
        if (order.Status === 'cancelled' || order.Status === 'completed') throw new AppError("Cannot cancel a cancelled or completed order", 400);

        const product = await ProductModel.findByID(order.Product_ID);
        if (product) {
            const currentQuantity = product.Quantity || 0;
            const restoredQuantity = currentQuantity + order.Quantity;
            return await OrderModel.cancelOrderTransaction(orderID, order.Product_ID, restoredQuantity);
        }
        return await OrderModel.updateOrder(orderID, 'cancelled');
    },

    /** Allow a seller to record an order on behalf of a buyer for a product they own, setting the target status */
    sellerRecordOrder: async (sellerID: number, buyerID: number, productID: number, targetStatus: 'reserved' | 'sold'): Promise<number> => {
        if (!productID || !buyerID) throw new AppError("Product ID and Buyer ID are required", 400);
        if (buyerID === sellerID) throw new AppError("Buyer cannot be the same as seller", 400);

        const product = await ProductModel.findByID(productID);
        if (!product) throw new AppError("Product not found", 404);
        if (product.Seller_ID !== sellerID) throw new AppError("You don't own this product", 403);

        const qty = Math.max(1, product.Quantity || 1);
        const orderStatus = targetStatus === 'sold' ? 'completed' : 'pending';
        const newProductStatus = targetStatus === 'sold' ? 'sold' : 'reserved';

        const newOrder: Order = {
            Product_ID: productID,
            Buyer_ID: buyerID,
            Seller_ID: sellerID,
            Quantity: qty,
            Total_Price: product.Price * qty,
            Status: orderStatus,
        };

        return await OrderModel.createOrderTransaction(newOrder, productID, newProductStatus);
    },
};
