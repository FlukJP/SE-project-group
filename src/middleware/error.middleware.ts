import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { AuthRequest } from './auth.middleware';
import { SERVER_ENV as ENV } from "../config/env";

interface HttpError extends Error {
    code?: string;
    type?: string;
}

// Map well-known status codes to a short error code string
const STATUS_CODE_MAP: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
};

/** Classify errors, log them, and return a normalized JSON error response */
export const errorHandler = (err: HttpError, req: AuthRequest, res: Response, _next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err instanceof SyntaxError) {
        statusCode = 400;
        message = 'Invalid JSON payload';
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Data already exists (Duplicate Entry)';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
        statusCode = 400;
        message = 'Invalid reference ID provided';
    } else if (err.type === 'entity.too.large') {
        statusCode = 413;
        message = 'Request body too large';
    } else if (err.message) {
        message = err.message;
    }

    const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode,
        message: err.message,
        userId: req.user?.userID,
    };
    console.error(logData);
    if (statusCode === 500) console.error(err);

    const isDevMode = ENV.NODE_ENV === 'development';

    res.status(statusCode).json({
        success: false,
        statusCode,
        error: STATUS_CODE_MAP[statusCode] || 'INTERNAL_ERROR',
        message,
        ...(isDevMode && { stack: err.stack }),
    });
};
