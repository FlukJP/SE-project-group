import multer from 'multer';
import { UPLOAD_CONFIG } from './constants';

// 1.Mime type to extension mapping
const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
};

// 2.Get extension from mimetype
const getExtension = (mimetype: string): string => {
    if (!MIME_TO_EXT[mimetype]) throw new Error('Unsupported Mime Type in storage');
    return MIME_TO_EXT[mimetype];
};

// 3.Generate unique filename
const generateUniqueFilename = (prefix: string, mimetype: string): string => {
    const ext = getExtension(mimetype);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    return `${prefix}-${uniqueSuffix}${ext}`;
};

// 4.Factory function
const createMulterStorage = (uploadDir: string, filePrefix: string) =>
    multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => cb(null, generateUniqueFilename(filePrefix, file.mimetype)),
    });

// 5.Factory function
const createMulterLimits = (maxSize: number) => ({ fileSize: maxSize, });

// 6.Unified config object
export const MULTER_CONFIG = {
    product: {
        storage: createMulterStorage(UPLOAD_CONFIG.PRODUCT.UPLOAD_DIR, 'product'),
        limits: createMulterLimits(UPLOAD_CONFIG.PRODUCT.MAX_SIZE),
    },
    user: {
        storage: createMulterStorage(UPLOAD_CONFIG.USER.UPLOAD_DIR, 'avatar'),
        limits: createMulterLimits(UPLOAD_CONFIG.USER.MAX_SIZE),
    },
} as const;

// 7.Exports
export const multerProductStorage = MULTER_CONFIG.product.storage;
export const multerProductLimits = MULTER_CONFIG.product.limits;
export const multerUserStorage = MULTER_CONFIG.user.storage;
export const multerUserLimits = MULTER_CONFIG.user.limits;