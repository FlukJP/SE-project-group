import { UPLOAD_CONFIG } from '../config/constants';
import { AppError } from '../errors/AppError';

export const isAllowedMimeType = (mimetype: string): boolean =>
    UPLOAD_CONFIG.ALLOWED_MIMES.includes(mimetype);

export const validateUploadedFile = (file: Express.Multer.File): void => {
    if (!isAllowedMimeType(file.mimetype)) {
        throw new AppError(`Invalid file type. Allowed: ${UPLOAD_CONFIG.ALLOWED_MIMES.join(', ')}`, 400);
    }
};
