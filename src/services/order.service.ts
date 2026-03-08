import { Order } from "@/src/types/Order";
import { OrderModel } from "@/src/models/orderModel";
import { AppError } from "@/src/errors/AppError";
import { ProductModel } from "@/src/models/productModel";
import { CategoryService } from "@/src/services/category.service";

export const OrderService = {
    // 1.Create order
    createOrder: async ( buyerID: number, orderData: {Product_ID: number; Quantity: number}): Promise<number> => {
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
        const remainingQuantity = currentQuantity - orderData.Quantity;
        const newProductStatus = remainingQuantity === 0 ? 'sold' : product.Status;
        const orderID = await OrderModel.createOrderTransaction(newOrder, product.Product_ID!, remainingQuantity, newProductStatus!);

        if (product.Category) {
            CategoryService.recordPopularity(product.Category, 'purchase').catch(() => {});
        }

        return orderID;

    },

    // 2.Get order by ID
    getOrderByID: async (orderID: number, userID: number): Promise<Order> => {
        if (!orderID) throw new AppError("Order ID is required", 400);
        const order = await OrderModel.findByID(orderID);
        if (!order) throw new AppError("Order not found", 404);
        if (userID !== order.Buyer_ID && userID !== order.Seller_ID) throw new AppError("Unauthorized to view this order", 403);
        return order;
    },

    // 3.Get order by Buyer id
    getOrderByBuyerID: async (buyerID: number): Promise<Order[]> => {
        if (!buyerID) throw new AppError("Buyer ID is required", 400);
        const orders = await OrderModel.findByBuyerID(buyerID);
        return orders || [];
    },

    // 4.Get order by Seller id
    getOrderBySellerID: async (sellerID: number): Promise<Order[]> => {
        if (!sellerID) throw new AppError("Seller ID is required", 400);
        const orders = await OrderModel.findBySellerID(sellerID);
        return orders || [];
    },

    // 5.Update order status
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

    // 6.Cancel order
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
    }
};