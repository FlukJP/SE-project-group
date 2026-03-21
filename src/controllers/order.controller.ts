import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { OrderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const OrderController = {
    /** Validate input and create a new order for the authenticated buyer */
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

    /** Return the details of a single order, verifying the user is the buyer or seller */
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

    /** Return all orders where the authenticated user is the buyer */
    getMyBuyerOrders: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);

            const orders = await OrderService.getOrderByBuyerID(req.user.userID);

            res.status(200).json({ success: true, data: orders });
        } catch (error) {
            next(error);
        }
    },

    /** Return all orders where the authenticated user is the seller */
    getMySellerOrders: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);

            const orders = await OrderService.getOrderBySellerID(req.user.userID);

            res.status(200).json({ success: true, data: orders });
        } catch (error) {
            next(error);
        }
    },

    /** Advance the order status following allowed transitions (pending→paid by buyer, paid→completed by seller) */
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

    /** Cancel an order and restore product stock */
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

    /** Allow a seller to record an order on behalf of a buyer for a product they own */
    sellerRecord: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new AppError('Unauthorized', 401);
            const { Product_ID, Buyer_ID, targetStatus } = req.body;
            if (!Product_ID || !Buyer_ID || !targetStatus) throw new AppError('Product_ID, Buyer_ID and targetStatus are required', 400);
            if (targetStatus !== 'reserved' && targetStatus !== 'sold') throw new AppError("targetStatus must be 'reserved' or 'sold'", 400);

            const orderId = await OrderService.sellerRecordOrder(
                req.user.userID,
                Number(Buyer_ID),
                Number(Product_ID),
                targetStatus,
            );
            res.status(201).json({ success: true, orderId });
        } catch (error) {
            next(error);
        }
    },
};
