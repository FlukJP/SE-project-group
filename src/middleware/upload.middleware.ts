import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { multerProductStorage, multerProductLimits } from '../config/upload';
import { validateUploadedFile, ensureUploadDirExists } from '../utils/uploadHelpers';
import { UPLOAD_ERRORS } from '../config/constants';
import { AppError } from '../errors/AppError';

// Initialize
ensureUploadDirExists();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
        validateUploadedFile(file);
        cb(null, true);
    } catch (error) {
        cb(error as Error); 
    }
};

export const uploadProductImage = multer({
    storage: multerProductStorage,
    limits: multerProductLimits,
    fileFilter,
});

// Middleware for handling Multer errors.
export const handleUploadError = ( err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError(UPLOAD_ERRORS.FILE_TOO_LARGE, 400));
        return next(new AppError(err.message, 400)); 
    }
    next(err);
};