import { describe, it, expect } from 'vitest';
import { pickUpdateFields } from '@/src/types/User';

describe('pickUpdateFields', () => {
    it('should pick only allowed fields (Username, Phone_number, Address)', () => {
        const result = pickUpdateFields({
            Username: 'newname',
            Phone_number: '0812345678',
            Address: '123 Street',
        });
        expect(result).toEqual({
            Username: 'newname',
            Phone_number: '0812345678',
            Address: '123 Street',
        });
    });

    it('should strip out disallowed fields', () => {
        const result = pickUpdateFields({
            Username: 'newname',
            Email: 'hack@evil.com',
            Password: 'newpassword',
            Role: 'admin',
            Is_Banned: false,
        });
        expect(result).toEqual({ Username: 'newname' });
        expect(result).not.toHaveProperty('Email');
        expect(result).not.toHaveProperty('Password');
        expect(result).not.toHaveProperty('Role');
        expect(result).not.toHaveProperty('Is_Banned');
    });

    it('should return empty object when no valid fields provided', () => {
        const result = pickUpdateFields({
            Email: 'hack@evil.com',
            Role: 'admin',
        });
        expect(result).toEqual({});
    });

    it('should ignore undefined values', () => {
        const result = pickUpdateFields({
            Username: undefined,
            Phone_number: '0812345678',
        });
        expect(result).toEqual({ Phone_number: '0812345678' });
        expect(result).not.toHaveProperty('Username');
    });
});
