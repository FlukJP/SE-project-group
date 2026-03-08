import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '@/src/services/order.service';
import { OrderModel } from '@/src/models/orderModel';
import { ProductModel } from '@/src/models/productModel';
import type { Order } from '@/src/types/Order';
import type { ProductWithSeller } from '@/src/types/Product';

vi.mock('@/src/models/orderModel');
vi.mock('@/src/models/productModel');
vi.mock('@/src/services/category.service', () => ({
    CategoryService: {
        recordPopularity: vi.fn(async () => {}),
    },
}));

const sampleProduct: ProductWithSeller = {
    Product_ID: 1,
    Seller_ID: 10,
    Title: 'Test',
    Description: 'A test product',
    Price: 500,
    Condition: 'new',
    Category_ID: 1,
    Status: 'available',
    Quantity: 3,
    Image_URL: '["img.jpg"]',
    SellerName: 'TestSeller',
    SellerEmail: 'seller@test.com',
    Category_Key: 'phones',
};

const sampleOrder: Order = {
    Order_ID: 100,
    Product_ID: 1,
    Buyer_ID: 20,
    Seller_ID: 10,
    Quantity: 1,
    Total_Price: 500,
    Status: 'pending',
};

describe('OrderService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // ===== createOrder =====
    describe('createOrder', () => {
        it('should throw when required fields are missing', async () => {
            await expect(OrderService.createOrder(20, { Product_ID: 0, Quantity: 1 })).rejects.toThrow('Missing required fields');
            await expect(OrderService.createOrder(20, { Product_ID: 1, Quantity: 0 })).rejects.toThrow('Missing required fields');
        });

        it('should throw when quantity is negative', async () => {
            await expect(OrderService.createOrder(20, { Product_ID: 1, Quantity: -1 })).rejects.toThrow('Quantity must be greater than 0');
        });

        it('should throw when product not found', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(null);
            await expect(OrderService.createOrder(20, { Product_ID: 999, Quantity: 1 })).rejects.toThrow('Product not found');
        });

        it('should throw when buyer is the seller', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(sampleProduct);
            await expect(OrderService.createOrder(10, { Product_ID: 1, Quantity: 1 })).rejects.toThrow('Cannot order your own product');
        });

        it('should throw when stock is insufficient', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue({ ...sampleProduct, Quantity: 2 });
            await expect(OrderService.createOrder(20, { Product_ID: 1, Quantity: 5 })).rejects.toThrow('Not enough stock available');
        });

        it('should create order successfully', async () => {
            vi.mocked(ProductModel.findByID).mockResolvedValue(sampleProduct);
            vi.mocked(OrderModel.createOrderTransaction).mockResolvedValue(100);

            const result = await OrderService.createOrder(20, { Product_ID: 1, Quantity: 1 });
            expect(result).toBe(100);
            expect(OrderModel.createOrderTransaction).toHaveBeenCalledTimes(1);
        });
    });

    // ===== getOrderByID =====
    describe('getOrderByID', () => {
        it('should throw when order not found', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(null);
            await expect(OrderService.getOrderByID(999, 20)).rejects.toThrow('Order not found');
        });

        it('should throw 403 when user is not buyer or seller', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            await expect(OrderService.getOrderByID(100, 999)).rejects.toThrow('Unauthorized to view this order');
        });

        it('should return order for buyer', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            const result = await OrderService.getOrderByID(100, 20);
            expect(result).toEqual(sampleOrder);
        });

        it('should return order for seller', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            const result = await OrderService.getOrderByID(100, 10);
            expect(result).toEqual(sampleOrder);
        });
    });

    // ===== updateOrderStatus =====
    describe('updateOrderStatus', () => {
        it('should throw when order not found', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(null);
            await expect(OrderService.updateOrderStatus(999, 20, 'paid')).rejects.toThrow('Order not found');
        });

        it('should throw 403 when user is unrelated to order', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            await expect(OrderService.updateOrderStatus(100, 999, 'paid')).rejects.toThrow('Unauthorized to update this order');
        });

        it('should throw when trying to update cancelled order', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue({ ...sampleOrder, Status: 'cancelled' });
            await expect(OrderService.updateOrderStatus(100, 20, 'paid')).rejects.toThrow('Cannot update a cancelled or completed order');
        });

        it('should allow buyer to mark pending as paid', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            vi.mocked(OrderModel.updateOrder).mockResolvedValue(true);

            const result = await OrderService.updateOrderStatus(100, 20, 'paid');
            expect(result).toBe(true);
        });

        it('should allow seller to mark paid as completed', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue({ ...sampleOrder, Status: 'paid' });
            vi.mocked(OrderModel.updateOrder).mockResolvedValue(true);

            const result = await OrderService.updateOrderStatus(100, 10, 'completed');
            expect(result).toBe(true);
        });

        it('should throw on invalid status transition (buyer cannot complete)', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            await expect(OrderService.updateOrderStatus(100, 20, 'completed')).rejects.toThrow('Invalid status transition or permission denied');
        });
    });

    // ===== cancelOrder =====
    describe('cancelOrder', () => {
        it('should throw when order not found', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(null);
            await expect(OrderService.cancelOrder(999, 20)).rejects.toThrow('Order not found');
        });

        it('should throw 403 when user is unrelated', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            await expect(OrderService.cancelOrder(100, 999)).rejects.toThrow('Unauthorized to cancel this order');
        });

        it('should throw when order is already cancelled', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue({ ...sampleOrder, Status: 'cancelled' });
            await expect(OrderService.cancelOrder(100, 20)).rejects.toThrow('Cannot cancel a cancelled or completed order');
        });

        it('should throw when order is already completed', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue({ ...sampleOrder, Status: 'completed' });
            await expect(OrderService.cancelOrder(100, 20)).rejects.toThrow('Cannot cancel a cancelled or completed order');
        });

        it('should cancel and restore product quantity', async () => {
            vi.mocked(OrderModel.findByID).mockResolvedValue(sampleOrder);
            vi.mocked(ProductModel.findByID).mockResolvedValue(sampleProduct);
            vi.mocked(OrderModel.cancelOrderTransaction).mockResolvedValue(true);

            const result = await OrderService.cancelOrder(100, 20);
            expect(result).toBe(true);
            expect(OrderModel.cancelOrderTransaction).toHaveBeenCalledWith(100, 1, 4); // 3 + 1
        });
    });
});
