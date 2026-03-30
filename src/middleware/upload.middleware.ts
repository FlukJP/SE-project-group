import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { MULTER_CONFIG } from '../config/upload';
import { UPLOAD_CONFIG } from '../config/constants';
import { validateUploadedFile } from '../utils/uploadHelpers';
import { AppError } from '../errors/AppError';

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
        validateUploadedFile(file);
        cb(null, true);
    } catch (error) {
        cb(error as Error);
    }
};

/** Multer middleware configured for product image uploads (memory storage) */
export const uploadProductImage = multer({
    storage: MULTER_CONFIG.product.storage,
    limits: MULTER_CONFIG.product.limits,
    fileFilter,
});

/** Multer middleware configured for user avatar uploads (memory storage) */
export const uploadUserAvatar = multer({
    storage: MULTER_CONFIG.user.storage,
    limits: MULTER_CONFIG.user.limits,
    fileFilter,
});

/** Verify file signatures (magic bytes) from the in-memory buffer before uploading to Firebase */
export const validateImageMagicBytes = async (req: Request, _res: Response, next: NextFunction) => {
    const files: Express.Multer.File[] = req.file ? [req.file] : (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return next();

    try {
        const fileTypeModule = await import('file-type');
        const fromBuffer =
            (fileTypeModule as { fromBuffer?: (buffer: Buffer) => Promise<{ mime: string } | undefined> }).fromBuffer
            ?? (fileTypeModule as { fileTypeFromBuffer?: (buffer: Buffer) => Promise<{ mime: string } | undefined> }).fileTypeFromBuffer
            ?? (fileTypeModule as { default?: { fromBuffer?: (buffer: Buffer) => Promise<{ mime: string } | undefined>; fileTypeFromBuffer?: (buffer: Buffer) => Promise<{ mime: string } | undefined> } }).default?.fromBuffer
            ?? (fileTypeModule as { default?: { fileTypeFromBuffer?: (buffer: Buffer) => Promise<{ mime: string } | undefined> } }).default?.fileTypeFromBuffer;

        if (!fromBuffer) {
            throw new AppError('Image validation library is unavailable. Please try again later.', 500);
        }

        for (const file of files) {
            const meta = await fromBuffer(file.buffer);
            if (!meta || !UPLOAD_CONFIG.ALLOWED_MIMES.includes(meta.mime)) {
                throw new AppError('Invalid image file. File signature does not match allowed types.', 400);
            }
        }
        next();
    } catch (err) {
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
