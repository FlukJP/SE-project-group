import fs from 'fs';
import path from 'path';
import { UPLOAD_CONFIG } from '../config/constants';
import { AppError } from '../errors/AppError';
import { UploadFolderType } from '../types/upload';

// Mapping folder types to config
const FOLDER_MAP: Record<UploadFolderType, string> = {
    [UploadFolderType.PRODUCT]: UPLOAD_CONFIG.PRODUCT.UPLOAD_DIR,
    [UploadFolderType.USER]: UPLOAD_CONFIG.USER.UPLOAD_DIR,
};

// Create directory helper
const createUploadDir = (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

// Ensure all upload directories exist
export const ensureUploadDirExists = (): void => {
    Object.values(FOLDER_MAP).forEach(createUploadDir);
};

// Check if mime type is allowed
export const isAllowedMimeType = (mimetype: string): boolean => {
    return UPLOAD_CONFIG.ALLOWED_MIMES.includes(mimetype);
};

// Validate uploaded file
export const validateUploadedFile = (file: Express.Multer.File): void => {
    if (!isAllowedMimeType(file.mimetype)) throw new AppError( `Invalid file type. Allowed: ${UPLOAD_CONFIG.ALLOWED_MIMES.join(', ')}`, 400 );
};

// Delete uploaded file with security checks
export const deleteUploadedFile = ( filename: string, folderType: UploadFolderType = UploadFolderType.PRODUCT ): void => {
    try {
        const safeFilename = path.basename(filename);
        const targetDir = FOLDER_MAP[folderType];
        const filePath = path.join(targetDir, safeFilename);
        const resolvedPath = path.resolve(filePath);
        const resolvedTargetDir = path.resolve(targetDir);
        if (!resolvedPath.startsWith(resolvedTargetDir)) throw new AppError('Invalid file path', 400);
        if (fs.existsSync(resolvedPath)) {
            fs.unlinkSync(resolvedPath);
            console.log(`[Upload] Deleted file: ${safeFilename}`);
        }
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(`[Upload] Failed to delete file: ${filename}`, error);
    }
};

// Get upload directory
export const getUploadDir = (folderType: UploadFolderType = UploadFolderType.PRODUCT): string => {
    return FOLDER_MAP[folderType];
};

// Get file path helper
export const getFilePath = ( filename: string, folderType: UploadFolderType = UploadFolderType.PRODUCT ): string => {
    const safeFilename = path.basename(filename);
    return path.join(FOLDER_MAP[folderType], safeFilename);
};

export const cleanupImages = (imageUrl: string) => {
    try {
        const images: string[] = JSON.parse(imageUrl);
        images.forEach((url) => {
            const filename = url.split('/').pop();
            if (filename) deleteUploadedFile(filename, UploadFolderType.PRODUCT);
        });
    } catch {
        const filename = imageUrl.split('/').pop();
        if (filename) deleteUploadedFile(filename, UploadFolderType.PRODUCT);
    }
};