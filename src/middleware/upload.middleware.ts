import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { MULTER_CONFIG } from '../config/upload';
import { UPLOAD_CONFIG } from '../config/constants';
import { validateUploadedFile } from '../utils/uploadHelpers';
import { AppError } from '../errors/AppError';

/** MIME type filter: validate the file using the upload helper before accepting it */
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
        validateUploadedFile(file);
        cb(null, true);
    } catch (error) {
        cb(error as Error);
    }
};

/** Multer middleware configured for product image uploads */
export const uploadProductImage = multer({
    storage: MULTER_CONFIG.product.storage,
    limits: MULTER_CONFIG.product.limits,
    fileFilter,
});

/** Multer middleware configured for user avatar uploads */
export const uploadUserAvatar = multer({
    storage: MULTER_CONFIG.user.storage,
    limits: MULTER_CONFIG.user.limits,
    fileFilter,
});

/** Verify file signatures (magic bytes) after Multer has written files to disk; deletes all files and rejects the request if any signature is invalid */
export const validateImageMagicBytes = async (req: Request, _res: Response, next: NextFunction) => {
    const files: Express.Multer.File[] = req.file ? [req.file] : (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return next();

    try {
        const { fileTypeFromFile } = await import('file-type');

        for (const file of files) {
            const meta = await fileTypeFromFile(file.path);
            if (!meta || !UPLOAD_CONFIG.ALLOWED_MIMES.includes(meta.mime)) {
                await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
                throw new AppError('Invalid image file. File signature does not match allowed types.', 400);
            }
        }
        next();
    } catch (err) {
        if (err instanceof AppError) return next(err);
        await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
        next(err);
    }
};

/** Translate Multer-specific errors (file size, file count) into AppErrors */
export const handleUploadError = (err: unknown, _req: Request, _res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('File too large!', 400));
        if (err.code === 'LIMIT_FILE_COUNT') return next(new AppError('Too many files!', 400));
    }
    next(err);
};
