import { describe, it, expect } from 'vitest';
import { pickFields } from '@/src/utils/objectUtils';

describe('pickFields', () => {
    it('should return only allowed keys', () => {
        const data = { a: 1, b: 2, c: 3 };
        const result = pickFields(data, ['a', 'b']);
        expect(result).toEqual({ a: 1, b: 2 });
        expect(result).not.toHaveProperty('c');
    });

    it('should omit keys with undefined values', () => {
        const data = { a: 1, b: undefined, c: 3 };
        const result = pickFields(data, ['a', 'b', 'c']);
        expect(result).toEqual({ a: 1, c: 3 });
        expect(result).not.toHaveProperty('b');
    });

    it('should return empty object when data has no allowed keys', () => {
        const data = { x: 10, y: 20 };
        const result = pickFields(data, ['a' as any, 'b' as any]);
        expect(result).toEqual({});
    });

    it('should return empty object when allowedKeys is empty', () => {
        const data = { a: 1, b: 2 };
        const result = pickFields(data, []);
        expect(result).toEqual({});
    });

    it('should return empty object when data is empty', () => {
        const result = pickFields({}, ['a' as any]);
        expect(result).toEqual({});
    });

    it('should include keys that have falsy but defined values (0, false, empty string)', () => {
        const data = { a: 0, b: false, c: '' };
        const result = pickFields(data, ['a', 'b', 'c'] as any);
        expect(result).toEqual({ a: 0, b: false, c: '' });
    });

    it('should include null values', () => {
        const data = { a: null, b: 1 };
        const result = pickFields(data, ['a', 'b'] as any);
        expect(result).toEqual({ a: null, b: 1 });
    });

    it('should handle extra keys in data that are not in allowedKeys', () => {
        const data = { name: 'Alice', email: 'alice@example.com', role: 'admin', password: 'secret' };
        const result = pickFields(data, ['name', 'email'] as any);
        expect(result).toEqual({ name: 'Alice', email: 'alice@example.com' });
        expect(result).not.toHaveProperty('role');
        expect(result).not.toHaveProperty('password');
    });
});
