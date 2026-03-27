import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validatePhoneNumber, validateUsername } from '@/src/utils/validators';

describe('validateEmail', () => {
    it('should accept valid emails', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name@domain.co.th')).toBe(true);
    });

    it('should reject invalid emails', () => {
        expect(validateEmail('')).toBe(false);
        expect(validateEmail('notanemail')).toBe(false);
        expect(validateEmail('missing@domain')).toBe(false);
        expect(validateEmail('@domain.com')).toBe(false);
        expect(validateEmail('user @domain.com')).toBe(false);
    });
});

describe('validatePassword', () => {
    it('should accept passwords that meet all complexity rules', () => {
        expect(validatePassword('Password1!')).toBe(true);
        expect(validatePassword('Nongfluk2!')).toBe(true);
    });

    it('should reject passwords that fail any password rule', () => {
        expect(validatePassword('')).toBe(false);
        expect(validatePassword('1234567')).toBe(false);
        expect(validatePassword('short')).toBe(false);
        expect(validatePassword('nongfluk2!')).toBe(false);
        expect(validatePassword('NONGFLUK2!')).toBe(false);
        expect(validatePassword('Nongfluk!!')).toBe(false);
        expect(validatePassword('Nongfluk2')).toBe(false);
    });
});

describe('validatePhoneNumber', () => {
    it('should accept valid 10-digit phone numbers', () => {
        expect(validatePhoneNumber('0812345678')).toBe(true);
        expect(validatePhoneNumber('0999999999')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
        expect(validatePhoneNumber('')).toBe(false);
        expect(validatePhoneNumber('123456789')).toBe(false);
        expect(validatePhoneNumber('08123456789')).toBe(false);
        expect(validatePhoneNumber('abcdefghij')).toBe(false);
        expect(validatePhoneNumber('081-234-5678')).toBe(false);
    });
});

describe('validateUsername', () => {
    it('should accept valid usernames', () => {
        expect(validateUsername('John')).toBe(true);
        expect(validateUsername('user_name')).toBe(true);
        expect(validateUsername('user-name')).toBe(true);
        expect(validateUsername('สมชาย')).toBe(true);
        expect(validateUsername('ab')).toBe(true);
    });

    it('should reject empty or whitespace-only usernames', () => {
        expect(validateUsername('')).toBe(false);
        expect(validateUsername('   ')).toBe(false);
    });

    it('should reject too short or too long usernames', () => {
        expect(validateUsername('a')).toBe(false);
        expect(validateUsername('a'.repeat(51))).toBe(false);
    });

    it('should reject usernames with special characters', () => {
        expect(validateUsername('user@name')).toBe(false);
        expect(validateUsername('user!name')).toBe(false);
        expect(validateUsername('<script>')).toBe(false);
    });
});
