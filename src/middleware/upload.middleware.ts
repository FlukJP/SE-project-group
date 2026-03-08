import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { MULTER_CONFIG } from '../config/upload';
import { UPLOAD_CONFIG } from '../config/constants';
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

// Magic bytes validation middleware - ตรวจสอบ file signature หลังจาก multer เขียนไฟล์แล้ว
export const validateImageMagicBytes = async (req: Request, res: Response, next: NextFunction) => {
    const files: Express.Multer.File[] = req.file ? [req.file] : (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return next();

    try {
        const { fileTypeFromFile } = await import('file-type');

        for (const file of files) {
            const meta = await fileTypeFromFile(file.path);
            if (!meta || !UPLOAD_CONFIG.ALLOWED_MIMES.includes(meta.mime)) {
                // ลบไฟล์ทั้งหมดที่ upload มาถ้าไม่ผ่าน validation
                await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
                throw new AppError('Invalid image file. File signature does not match allowed types.', 400);
            }
        }
        next();
    } catch (err) {
        if (err instanceof AppError) return next(err);
        // ลบไฟล์ทั้งหมดถ้าเกิด error
        await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
        next(err);
    }
};

// Error handler middleware
export const handleUploadError = ( err: any, req: Request, res: Response, next: NextFunction ) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('File too large!', 400));
        if (err.code === 'LIMIT_FILE_COUNT') return next(new AppError('Too many files!', 400));
    }
    next(err);
};
