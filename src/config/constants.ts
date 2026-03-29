import { SERVER_ENV as ENV } from "./env";

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
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const BYTES_IN_MB = 1024 * 1024;

// Accept either raw bytes (e.g. 5000000) or MB values (e.g. 5).
const parseFileSize = (sizeValue: number, fallbackInMb: number): number => {
    if (!Number.isFinite(sizeValue) || sizeValue <= 0) {
        return fallbackInMb * BYTES_IN_MB;
    }

    return sizeValue >= BYTES_IN_MB ? Math.floor(sizeValue) : Math.floor(sizeValue * BYTES_IN_MB);
};

export const UPLOAD_CONFIG = {
    ALLOWED_MIMES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    PRODUCT: {
        MAX_SIZE: parseFileSize(ENV.PRODUCT_MAX_SIZE, 5),
        CLOUD_FOLDER: "products",
    },
    USER: {
        MAX_SIZE: parseFileSize(ENV.USER_MAX_SIZE, 2),
        CLOUD_FOLDER: "users",
    },
};

export const UPLOAD_ERRORS = {
    NOT_IMAGE: "Not an image! Please upload only images.",
    INVALID_TYPE: "Invalid file type.",
    FILE_TOO_LARGE: "File too large!",
};
