export const OTP_TTL_SECONDS = 5 * 60;
export const RATE_LIMIT_TTL_SECONDS = 15 * 60;
export const MAX_OTP_REQUESTS = 5;
export const MAX_OTP_ATTEMPTS = 5;
export const SALT_ROUNDS = 10;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
const parseFileSize = (sizeInMB: string): number => { return parseInt(sizeInMB) * 1024 * 1024; };
export const UPLOAD_CONFIG = {
    ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    PRODUCT: {
        MAX_SIZE: parseFileSize(process.env.PRODUCT_MAX_SIZE || '5'),
        UPLOAD_DIR: process.env.PRODUCT_UPLOAD_DIR || 'public/uploads/products',
    },
    USER: {
        MAX_SIZE: parseFileSize(process.env.USER_MAX_SIZE || '2'),
        UPLOAD_DIR: process.env.USER_UPLOAD_DIR || 'public/uploads/users',
    },
};
export const UPLOAD_ERRORS = {
    NOT_IMAGE: 'Not an image! Please upload only images.',
    INVALID_TYPE: 'Invalid file type.',
    FILE_TOO_LARGE: 'File too large!',
};