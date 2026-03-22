import fs from 'fs';
import path from 'path';
import { UPLOAD_CONFIG } from '../config/constants';
import { AppError } from '../errors/AppError';
import { UploadFolderType } from '../types/upload';

// Maps each folder type to its configured upload directory path.
const FOLDER_MAP: Record<UploadFolderType, string> = {
    [UploadFolderType.PRODUCT]: UPLOAD_CONFIG.PRODUCT.UPLOAD_DIR,
    [UploadFolderType.USER]: UPLOAD_CONFIG.USER.UPLOAD_DIR,
};

// Creates the given directory path if it does not already exist.
const createUploadDir = (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

// Ensures all configured upload directories exist, creating them if necessary.
export const ensureUploadDirExists = (): void => {
    Object.values(FOLDER_MAP).forEach(createUploadDir);
};

// Returns true if the given MIME type is in the allowed list.
export const isAllowedMimeType = (mimetype: string): boolean => {
    return UPLOAD_CONFIG.ALLOWED_MIMES.includes(mimetype);
};

// Throws an AppError if the uploaded file's MIME type is not allowed.
export const validateUploadedFile = (file: Express.Multer.File): void => {
    if (!isAllowedMimeType(file.mimetype)) {
        throw new AppError(`Invalid file type. Allowed: ${UPLOAD_CONFIG.ALLOWED_MIMES.join(', ')}`, 400);
    }
};

// Safely deletes an uploaded file from the specified folder, preventing path traversal attacks.
export const deleteUploadedFile = (
    filename: string,
    folderType: UploadFolderType = UploadFolderType.PRODUCT,
): void => {
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

// Returns the upload directory path for the given folder type.
export const getUploadDir = (folderType: UploadFolderType = UploadFolderType.PRODUCT): string => {
    return FOLDER_MAP[folderType];
};

// Returns the full file path for the given filename within the specified folder type.
export const getFilePath = (
    filename: string,
    folderType: UploadFolderType = UploadFolderType.PRODUCT,
): string => {
    const safeFilename = path.basename(filename);
    return path.join(FOLDER_MAP[folderType], safeFilename);
};

// Parses an image URL or JSON array of URLs and deletes each corresponding file from the product upload folder.
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
