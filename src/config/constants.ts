export const OTP_TTL_SECONDS = 5 * 60;
export const RATE_LIMIT_TTL_SECONDS = 15 * 60;
export const MAX_OTP_REQUESTS = 5;
export const MAX_OTP_ATTEMPTS = 5;
export const SALT_ROUNDS = 10;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const UPLOAD_CONFIG = {
    ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5') * 1024 * 1024,
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'public/uploads/products',
};
export const UPLOAD_ERRORS = {
    NOT_IMAGE: 'Not an image! Please upload only images.',
    INVALID_TYPE: 'Invalid file type.',
    FILE_TOO_LARGE: 'File too large!',
};