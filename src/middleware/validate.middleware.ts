import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { validateEmail, validatePassword, validatePhoneNumber, validateUsername } from '../utils/validators';

// Generic schema types
type FieldRule = {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean';
    min?: number;
    max?: number;
    oneOf?: readonly string[];
    custom?: (value: unknown) => string | null; // return error message or null
};

type Schema = Record<string, FieldRule>;

// Validate middleware factory — validates req.body against a schema
export function validateBody(schema: Schema) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const errors: string[] = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = req.body[field];

            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }

            if (value === undefined || value === null || value === '') continue;

            if (rules.type === 'string' && typeof value !== 'string') {
                errors.push(`${field} must be a string`);
                continue;
            }
            if (rules.type === 'number') {
                const num = Number(value);
                if (isNaN(num)) {
                    errors.push(`${field} must be a number`);
                    continue;
                }
                if (rules.min !== undefined && num < rules.min) errors.push(`${field} must be at least ${rules.min}`);
                if (rules.max !== undefined && num > rules.max) errors.push(`${field} must be at most ${rules.max}`);
            }
            if (rules.type === 'string' && typeof value === 'string') {
                if (rules.min !== undefined && value.length < rules.min) errors.push(`${field} must be at least ${rules.min} characters`);
                if (rules.max !== undefined && value.length > rules.max) errors.push(`${field} must be at most ${rules.max} characters`);
            }
            if (rules.oneOf && !rules.oneOf.includes(value)) {
                errors.push(`${field} must be one of: ${rules.oneOf.join(', ')}`);
            }
            if (rules.custom) {
                const err = rules.custom(value);
                if (err) errors.push(err);
            }
        }

        if (errors.length > 0) {
            return next(new AppError(errors.join('; '), 400));
        }
        next();
    };
}

// Validate params middleware factory
export function validateParams(schema: Schema) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const errors: string[] = [];

        for (const [field, rules] of Object.entries(schema)) {
            const raw = req.params[field];
            const value = Array.isArray(raw) ? raw[0] : raw;

            if (rules.required && (!value || value.trim() === '')) {
                errors.push(`${field} is required`);
                continue;
            }

            if (rules.type === 'number') {
                const num = Number(value);
                if (isNaN(num) || num <= 0) errors.push(`${field} must be a positive number`);
            }
        }

        if (errors.length > 0) {
            return next(new AppError(errors.join('; '), 400));
        }
        next();
    };
}

// Pre-built schemas for each domain

// Auth
export const registerSchema: Schema = {
    username: { required: true, type: 'string', custom: (v) => validateUsername(v as string) ? null : 'Username must be 2-50 characters (letters, numbers, spaces, underscores, hyphens, Thai)' },
    email:    { required: true, type: 'string', custom: (v) => validateEmail(v as string) ? null : 'Invalid email format' },
    password: { required: true, type: 'string', custom: (v) => validatePassword(v as string) ? null : 'Password must be at least 8 characters' },
    phone:    { required: true, type: 'string', custom: (v) => validatePhoneNumber(v as string) ? null : 'Phone number must be 10 digits' },
};

export const loginSchema: Schema = {
    email:    { required: true, type: 'string', custom: (v) => validateEmail(v as string) ? null : 'Invalid email format' },
    password: { required: true, type: 'string' },
};

export const refreshTokenSchema: Schema = {
    refresh_token: { required: true, type: 'string' },
};

export const changePasswordSchema: Schema = {
    oldPassword: { required: true, type: 'string' },
    newPassword: { required: true, type: 'string', custom: (v) => validatePassword(v as string) ? null : 'New password must be at least 8 characters' },
};

export const requestOtpSchema: Schema = {
    email: { required: true, type: 'string', custom: (v) => validateEmail(v as string) ? null : 'Invalid email format' },
};

export const verifyOtpSchema: Schema = {
    email: { required: true, type: 'string', custom: (v) => validateEmail(v as string) ? null : 'Invalid email format' },
    otp:   { required: true, type: 'string' },
};

export const resetPasswordSchema: Schema = {
    email:       { required: true, type: 'string', custom: (v) => validateEmail(v as string) ? null : 'Invalid email format' },
    otp:         { required: true, type: 'string' },
    newPassword: { required: true, type: 'string', custom: (v) => validatePassword(v as string) ? null : 'New password must be at least 8 characters' },
};

export const requestPhoneOtpSchema: Schema = {
    phone: { required: true, type: 'string', custom: (v) => validatePhoneNumber(v as string) ? null : 'Phone number must be 10 digits' },
};

export const verifyPhoneOtpSchema: Schema = {
    phone: { required: true, type: 'string', custom: (v) => validatePhoneNumber(v as string) ? null : 'Phone number must be 10 digits' },
    otp:   { required: true, type: 'string' },
};

export const verifyPhoneFirebaseSchema: Schema = {
    idToken: { required: true, type: 'string' },
};

// Order
export const createOrderSchema: Schema = {
    Product_ID: { required: true, type: 'number', min: 1 },
    Quantity:   { required: true, type: 'number', min: 1 },
};

export const updateOrderStatusSchema: Schema = {
    status: { required: true, type: 'string', oneOf: ['paid', 'completed'] as const },
};

// Review
export const createReviewSchema: Schema = {
    orderId: { required: true, type: 'number', min: 1 },
    rating:  { required: true, type: 'number', min: 1, max: 5 },
    comment: { type: 'string', max: 1000 },
};

// Report
export const createReportSchema: Schema = {
    targetId:   { required: true, type: 'number', min: 1 },
    reportType: { required: true, type: 'string', oneOf: ['product', 'user'] as const },
    reason:     { required: true, type: 'string', min: 1, max: 500 },
};

// Chat
export const createChatSchema: Schema = {
    productId:    { required: true, type: 'number', min: 1 },
    sellerId: { required: true, type: 'number', min: 1 },
};

export const sendMessageSchema: Schema = {
    content: { required: true, type: 'string', min: 1, max: 2000 },
};

// Category (admin)
export const createCategorySchema: Schema = {
    category_key: { required: true, type: 'string', min: 1, max: 50 },
    name:         { required: true, type: 'string', min: 1, max: 100 },
    emoji:        { required: true, type: 'string', min: 1, max: 10 },
};

// Param validators
export const idParam: Schema = {
    id: { required: true, type: 'number' },
};

export const orderIdParam: Schema = {
    orderId: { required: true, type: 'number' },
};

export const sellerIdParam: Schema = {
    sellerId: { required: true, type: 'number' },
};

export const chatIdParam: Schema = {
    chatId: { required: true, type: 'number' },
};
