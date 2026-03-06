import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let message = err.message ||"Internal Server Error";
    
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err instanceof SyntaxError) {
        statusCode = 400;
        message = "Invalid JSON Payload";
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = "Data already exists (Duplicate Entry)";
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
        statusCode = 400;
        message = "Invalid reference ID provided";
    }
    
    const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode,
        message: err.message,
        userId: (req as any).user?.userID
    };
    console.error(logData);
    if (statusCode === 500) console.error(err);
    res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};