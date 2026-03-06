import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { MULTER_CONFIG } from '../config/upload';
import { validateUploadedFile } from '../utils/uploadHelpers';
import { AppError } from '../errors/AppError';

// File filter function
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
        validateUploadedFile(file);
        cb(null, true);
    } catch (error) {
        cb(error as Error);
    }
};

// Product image upload middleware
export const uploadProductImage = multer({
    storage: MULTER_CONFIG.product.storage,
    limits: MULTER_CONFIG.product.limits,
    fileFilter,
});

// User avatar upload middleware
export const uploadUserAvatar = multer({
    storage: MULTER_CONFIG.user.storage,
    limits: MULTER_CONFIG.user.limits,
    fileFilter,
});

// Error handler middleware
export const handleUploadError = ( err: any, req: Request, res: Response, next: NextFunction ) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('File too large!', 400));
        if (err.code === 'LIMIT_FILE_COUNT') return next(new AppError('Too many files!', 400));
    }
    next(err);
};