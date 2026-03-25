import { describe, it, expect } from 'vitest';
import { pickUpdateFields } from '@/src/types/User';
import type { User } from '@/src/types/User';

describe('pickUpdateFields', () => {
    it('should include Username when provided', () => {
        const result = pickUpdateFields({ Username: 'Alice' });
        expect(result).toEqual({ Username: 'Alice' });
    });

    it('should include Phone_number when provided', () => {
        const result = pickUpdateFields({ Phone_number: '0812345678' });
        expect(result).toEqual({ Phone_number: '0812345678' });
    });

    it('should include Address when provided', () => {
        const result = pickUpdateFields({ Address: '123 Main St' });
        expect(result).toEqual({ Address: '123 Main St' });
    });

    it('should include Avatar_URL when provided', () => {
        const result = pickUpdateFields({ Avatar_URL: 'https://example.com/avatar.png' });
        expect(result).toEqual({ Avatar_URL: 'https://example.com/avatar.png' });
    });

    it('should include all allowed fields when all are provided', () => {
        const data: Partial<User> = {
            Username: 'Bob',
            Phone_number: '0899999999',
            Address: '456 Elm St',
            Avatar_URL: 'https://example.com/pic.jpg',
        };
        const result = pickUpdateFields(data);
        expect(result).toEqual(data);
    });

    it('should exclude non-allowed fields (Email, Role, Password)', () => {
        const data: Partial<User> = {
            Username: 'Charlie',
            Email: 'charlie@example.com',
            Role: 'admin',
            Password: 'secret',
        };
        const result = pickUpdateFields(data);
        expect(result).toEqual({ Username: 'Charlie' });
        expect(result).not.toHaveProperty('Email');
        expect(result).not.toHaveProperty('Role');
        expect(result).not.toHaveProperty('Password');
    });

    it('should return empty object when no allowed fields are provided', () => {
        const data: Partial<User> = {
            Email: 'x@x.com',
            Role: 'customer',
        };
        const result = pickUpdateFields(data);
        expect(result).toEqual({});
    });

    it('should return empty object when data is empty', () => {
        const result = pickUpdateFields({});
        expect(result).toEqual({});
    });

    it('should omit fields with undefined values', () => {
        const result = pickUpdateFields({ Username: undefined, Phone_number: '0812345678' });
        expect(result).toEqual({ Phone_number: '0812345678' });
        expect(result).not.toHaveProperty('Username');
    });

    it('should include empty string values (explicit clear)', () => {
        const result = pickUpdateFields({ Username: '' });
        expect(result).toEqual({ Username: '' });
    });
});
