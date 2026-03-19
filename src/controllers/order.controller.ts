import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { OrderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const OrderController = {
    // 1.Create new order
    create: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);

            const { Product_ID, Quantity } = req.body;
            const orderId = await OrderService.createOrder(req.user.userID, {
                Product_ID: Number(Product_ID),
                Quantity: Number(Quantity),
            });

            res.status(201).json({ success: true, message: 'Order created successfully', orderId });
        } catch (error) {
            next(error);
        }
    },

    // 2.Get Order by ID
    getByID: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);

            const orderId = Number(req.params.orderId);
            if (!orderId || orderId <= 0) throw new AppError('Invalid order ID', 400);

            const order = await OrderService.getOrderByID(orderId, req.user.userID);

            res.status(200).json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    },

    // 3.Get My Buyer Orders
    getMyBuyerOrders: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);

            const orders = await OrderService.getOrderByBuyerID(req.user.userID);

            res.status(200).json({ success: true, data: orders });
        } catch (error) {
            next(error);
        }
    },

    // 4.Get My Seller Orders
    getMySellerOrders: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);

            const orders = await OrderService.getOrderBySellerID(req.user.userID);

            res.status(200).json({ success: true, data: orders });
        } catch (error) {
            next(error);
        }
    },

    // 5.Update Order Status
    updateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);

            const orderId = Number(req.params.orderId);
            if (!orderId || orderId <= 0) throw new AppError('Invalid order ID', 400);

            const { status } = req.body;
            if (status !== 'paid' && status !== 'completed') {
                throw new AppError("Status must be 'paid' or 'completed'", 400);
            }

            const result = await OrderService.updateOrderStatus(orderId, req.user.userID, status);

            res.status(200).json({ success: true, message: 'Order status updated successfully', updated: result });
        } catch (error) {
            next(error);
        }
    },

    // 6.Cancel Order
    cancel: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);

            const orderId = Number(req.params.orderId);
            if (!orderId || orderId <= 0) throw new AppError('Invalid order ID', 400);

            const result = await OrderService.cancelOrder(orderId, req.user.userID);

            res.status(200).json({ success: true, message: 'Order cancelled successfully', cancelled: result });
        } catch (error) {
            next(error);
        }
    },
};
