import rateLimit from 'express-rate-limit';
import 'dotenv/config';

const isDevMode = process.env.NODE_ENV !== 'production';

const createLimiter = (windowMs: number, max: number, message: string) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            if (!isDevMode) return false;
            const ip = req.ip || '';
            return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
        },
        message: { success: false, message }
    });
};

// Global Limiter
export const globalLimiter = createLimiter( 15 * 60 * 1000, 100, "Too many requests from this IP, please try again after 15 minutes." );
// Strict Limiter
export const loginLimiter = createLimiter( 5 * 60 * 1000, 5, "Too many login attempts, please try again after 5 minutes." );
// Signup Limiter
export const signupLimiter = createLimiter( 60 * 60 * 1000, 3, "Too many accounts created from this IP, please try again after an hour." );
//  Password Reset Limiter
export const passwordResetLimiter = createLimiter( 30 * 60 * 1000, 3, "Too many password reset requests. Please try again in 30 minutes." );
// API Endpoint Limiter
export const apiEndpointLimiter = createLimiter( 1 * 60 * 1000, 20, "You are requesting data too frequently. Please try again in a minute." );
