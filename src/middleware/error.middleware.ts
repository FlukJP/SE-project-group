import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

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

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    // --- Classify the error ---
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

    // --- Logging ---
    const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode,
        message: err.message,
        userId: (req as any).user?.userID,
    };
    console.error(logData);
    if (statusCode === 500) console.error(err);

    // --- Normalized response shape ---
    const isDevMode = process.env.NODE_ENV === 'development';

    res.status(statusCode).json({
        success: false,
        statusCode,
        error: STATUS_CODE_MAP[statusCode] || 'INTERNAL_ERROR',
        message,
        ...(isDevMode && { stack: err.stack }),
    });
};
