import fs from 'fs';
import { UPLOAD_CONFIG } from '../config/constants';
import { AppError } from '../errors/AppError';
import path from 'path';

export const ensureUploadDirExists = (): void => {
    if (!fs.existsSync(UPLOAD_CONFIG.UPLOAD_DIR)) fs.mkdirSync(UPLOAD_CONFIG.UPLOAD_DIR, { recursive: true });
};

export const isAllowedMimeType = (mimetype: string): boolean => {
    return UPLOAD_CONFIG.ALLOWED_MIMES.includes(mimetype);
};

export const deleteUploadedFile = (filename: string): void => {
    const safeFilename = path.basename(filename); 
    const filePath = path.join(UPLOAD_CONFIG.UPLOAD_DIR, safeFilename); 
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(UPLOAD_CONFIG.UPLOAD_DIR);
    if (resolvedPath.startsWith(resolvedUploadDir) && fs.existsSync(resolvedPath)) fs.unlinkSync(resolvedPath);
};

export const validateUploadedFile = (file: Express.Multer.File): void => {
    if (!isAllowedMimeType(file.mimetype)) throw new AppError(`Invalid file type. Allowed: ${UPLOAD_CONFIG.ALLOWED_MIMES.join(', ')}`, 400);
};