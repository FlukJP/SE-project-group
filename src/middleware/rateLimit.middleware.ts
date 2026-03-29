import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import { SERVER_ENV as ENV } from "../config/env";

const isDevMode = ENV.NODE_ENV !== 'production';

/** Create a rate-limiter middleware with the given time window, request limit, and error message; localhost is skipped in development */
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

// Global limiter: 300 requests per 15 minutes (suitable for SPAs that make multiple API calls per page)
export const globalLimiter = createLimiter(15 * 60 * 1000, 300, "Too many requests from this IP, please try again after 15 minutes.");
// Strict limiter for login attempts
export const loginLimiter = createLimiter(5 * 60 * 1000, 5, "Too many login attempts, please try again after 5 minutes.");
// Limiter for account registration
export const signupLimiter = createLimiter(60 * 60 * 1000, 3, "Too many accounts created from this IP, please try again after an hour.");
// Limiter for password reset requests
export const passwordResetLimiter = createLimiter(30 * 60 * 1000, 3, "Too many password reset requests. Please try again in 30 minutes.");
// Limiter for high-frequency API endpoints
export const apiEndpointLimiter = createLimiter(1 * 60 * 1000, 20, "You are requesting data too frequently. Please try again in a minute.");
