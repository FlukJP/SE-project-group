import { ENV } from './env';

// Redis
export const REDIS_URL = ENV.REDIS_URL;

// OTP and rate limiting
export const OTP_TTL_SECONDS = 5 * 60;
export const RATE_LIMIT_TTL_SECONDS = 15 * 60;
export const MAX_OTP_REQUESTS = 5;
export const MAX_OTP_ATTEMPTS = 5;

// Auth
export const SALT_ROUNDS = 10;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Converts a file size string in MB to bytes.
const parseFileSize = (sizeInMB: number): number => sizeInMB * 1024 * 1024;

export const UPLOAD_CONFIG = {
    ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    PRODUCT: {
        // ใส่ fallback || 5 เข้าไปเพื่อบอก TypeScript ว่าถ้าไม่มีค่า ให้ใช้เลข 5 แทนนะ
        MAX_SIZE: parseFileSize(ENV.PRODUCT_MAX_SIZE || 5),
        CLOUD_FOLDER: 'products',
    },
    USER: {
        // ใส่ fallback || 2 เข้าไป (สมมติให้รูปโปรไฟล์อัปได้สูงสุด 2MB)
        MAX_SIZE: parseFileSize(ENV.USER_MAX_SIZE || 2),
        CLOUD_FOLDER: 'users',
    }
};

export const UPLOAD_ERRORS = {
    NOT_IMAGE: 'Not an image! Please upload only images.',
    INVALID_TYPE: 'Invalid file type.',
    FILE_TOO_LARGE: 'File too large!',
};
