import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toProductDisplay } from '@/src/types/ProductDisplay';
import type { ProductWithSeller } from '@/src/types/Product';

vi.mock('@/src/lib/api', () => ({
    API_BASE: 'https://api.example.com',
}));

const baseProduct: ProductWithSeller = {
    Product_ID: 1,
    Seller_ID: 10,
    Title: 'iPhone 13',
    Description: 'สภาพดีมาก',
    Province: 'กรุงเทพมหานคร',
    District: 'เขตบางรัก',
    Price: 15000,
    Condition: 'มือสอง',
    Category_ID: 2,
    Category_Key: 'phones',
    Category_Name: 'โทรศัพท์มือถือ',
    Status: 'available',
    Image_URL: '[]',
    SellerName: 'สมชาย',
    SellerEmail: 'somchai@example.com',
    SellerPhone_number: '0812345678',
    SellerAvatar: 'https://cdn.example.com/avatar.jpg',
};

describe('toProductDisplay', () => {
    // ===== id, title, price, condition, status =====
    describe('basic fields', () => {
        it('should map basic fields correctly', () => {
            const result = toProductDisplay(baseProduct);
            expect(result.id).toBe('1');
            expect(result.title).toBe('iPhone 13');
            expect(result.price).toBe(15000);
            expect(result.condition).toBe('มือสอง');
            expect(result.status).toBe('available');
        });

        it('should use category_key and name', () => {
            const result = toProductDisplay(baseProduct);
            expect(result.categoryKey).toBe('phones');
            expect(result.categoryName).toBe('โทรศัพท์มือถือ');
        });

        it('should fall back to Category_ID string when Category_Key is missing', () => {
            const result = toProductDisplay({ ...baseProduct, Category_Key: undefined });
            expect(result.categoryKey).toBe('2');
        });

        it('should fall back to Category_Key as categoryName when Category_Name is missing', () => {
            const result = toProductDisplay({ ...baseProduct, Category_Name: undefined });
            expect(result.categoryName).toBe('phones');
        });
    });

    // ===== seller =====
    describe('seller mapping', () => {
        it('should map seller fields correctly', () => {
            const result = toProductDisplay(baseProduct);
            expect(result.seller.id).toBe('10');
            expect(result.seller.name).toBe('สมชาย');
            expect(result.seller.email).toBe('somchai@example.com');
            expect(result.seller.phone).toBe('0812345678');
            expect(result.seller.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
        });

        it('should use default seller name when SellerName is missing', () => {
            const result = toProductDisplay({ ...baseProduct, SellerName: '' });
            expect(result.seller.name).toBe('ผู้ขาย');
        });
    });

    // ===== image parsing =====
    describe('image parsing', () => {
        it('should return empty array when Image_URL is empty JSON array', () => {
            const result = toProductDisplay({ ...baseProduct, Image_URL: '[]' });
            expect(result.images).toEqual([]);
        });

        it('should parse JSON array of absolute URLs correctly', () => {
            const urls = ['https://cdn.example.com/img1.jpg', 'https://cdn.example.com/img2.jpg'];
            const result = toProductDisplay({ ...baseProduct, Image_URL: JSON.stringify(urls) });
            expect(result.images).toEqual(urls);
        });

        it('should prepend API_BASE to relative URLs in JSON array', () => {
            const urls = ['/uploads/img1.jpg', '/uploads/img2.jpg'];
            const result = toProductDisplay({ ...baseProduct, Image_URL: JSON.stringify(urls) });
            expect(result.images[0]).toBe('https://api.example.com/uploads/img1.jpg');
            expect(result.images[1]).toBe('https://api.example.com/uploads/img2.jpg');
        });

        it('should handle a single absolute URL string (non-JSON)', () => {
            const result = toProductDisplay({ ...baseProduct, Image_URL: 'https://cdn.example.com/img.jpg' });
            expect(result.images).toEqual(['https://cdn.example.com/img.jpg']);
        });

        it('should prepend API_BASE to a single relative URL string (non-JSON)', () => {
            const result = toProductDisplay({ ...baseProduct, Image_URL: '/uploads/img.jpg' });
            expect(result.images).toEqual(['https://api.example.com/uploads/img.jpg']);
        });

        it('should return empty array when Image_URL is empty string', () => {
            const result = toProductDisplay({ ...baseProduct, Image_URL: '' });
            expect(result.images).toEqual([]);
        });

        it('should return empty array when JSON value is not an array', () => {
            const result = toProductDisplay({ ...baseProduct, Image_URL: '"just-a-string"' });
            expect(result.images).toEqual([]);
        });
    });

    // ===== location =====
    describe('location building', () => {
        it('should combine Province and District into location', () => {
            const result = toProductDisplay(baseProduct);
            expect(result.province).toBe('กรุงเทพมหานคร');
            expect(result.district).toBe('เขตบางรัก');
            expect(result.location).toBe('กรุงเทพมหานคร (เขตบางรัก)');
        });

        it('should use only Province when District is missing', () => {
            const result = toProductDisplay({ ...baseProduct, District: '' });
            expect(result.location).toBe('กรุงเทพมหานคร');
        });

        it('should use only District when Province is missing', () => {
            const result = toProductDisplay({ ...baseProduct, Province: '' });
            expect(result.location).toBe('เขตบางรัก');
        });

        it('should fall back to Description regex when Province and District are empty', () => {
            const product = {
                ...baseProduct,
                Province: '',
                District: '',
                Description: 'สภาพดี\n\n📍 พื้นที่: เชียงใหม่',
            };
            const result = toProductDisplay(product);
            expect(result.location).toBe('เชียงใหม่');
        });

        it('should return empty location when neither columns nor regex match', () => {
            const product = {
                ...baseProduct,
                Province: '',
                District: '',
                Description: 'สภาพดีมาก',
            };
            const result = toProductDisplay(product);
            expect(result.location).toBe('');
        });
    });

    // ===== description cleaning =====
    describe('description cleaning', () => {
        it('should remove location footer from description', () => {
            const product = {
                ...baseProduct,
                Description: 'สภาพดีมาก\n\n📍 พื้นที่: กรุงเทพมหานคร',
            };
            const result = toProductDisplay(product);
            expect(result.description).not.toContain('📍 พื้นที่:');
            expect(result.description).toBe('สภาพดีมาก');
        });

        it('should remove phone contact line from description', () => {
            const product = {
                ...baseProduct,
                Description: 'ของดี\n📞 ติดต่อ: 0812345678',
            };
            const result = toProductDisplay(product);
            expect(result.description).not.toContain('📞 ติดต่อ:');
        });

        it('should return empty string when Description is missing', () => {
            const result = toProductDisplay({ ...baseProduct, Description: undefined as any });
            expect(result.description).toBe('');
        });
    });

    // ===== postedAt (formatThaiRelativeTime) =====
    describe('postedAt (relative time in Thai)', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return "เมื่อสักครู่" for timestamps under 1 minute ago', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-01T12:00:30Z'));
            const result = toProductDisplay({ ...baseProduct, Created_at: new Date('2024-01-01T12:00:00Z') });
            expect(result.postedAt).toBe('เมื่อสักครู่');
        });

        it('should return minutes for timestamps under 1 hour ago', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-01T12:30:00Z'));
            const result = toProductDisplay({ ...baseProduct, Created_at: new Date('2024-01-01T12:00:00Z') });
            expect(result.postedAt).toBe('30 นาทีที่แล้ว');
        });

        it('should return hours for timestamps under 24 hours ago', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-01T15:00:00Z'));
            const result = toProductDisplay({ ...baseProduct, Created_at: new Date('2024-01-01T12:00:00Z') });
            expect(result.postedAt).toBe('3 ชั่วโมงที่แล้ว');
        });

        it('should return "เมื่อวานนี้" for 1 day ago', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-02T12:00:00Z'));
            const result = toProductDisplay({ ...baseProduct, Created_at: new Date('2024-01-01T12:00:00Z') });
            expect(result.postedAt).toBe('เมื่อวานนี้');
        });

        it('should return days for timestamps under 30 days ago', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-11T12:00:00Z'));
            const result = toProductDisplay({ ...baseProduct, Created_at: new Date('2024-01-01T12:00:00Z') });
            expect(result.postedAt).toBe('10 วันที่แล้ว');
        });

        it('should return Thai date for timestamps 30+ days ago', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-03-01T12:00:00Z'));
            const result = toProductDisplay({ ...baseProduct, Created_at: new Date('2024-01-01T12:00:00Z') });
            expect(result.postedAt).toMatch(/\d+/);
        });

        it('should return empty string when Created_at is missing', () => {
            const result = toProductDisplay({ ...baseProduct, Created_at: undefined });
            expect(result.postedAt).toBe('');
        });
    });
});
