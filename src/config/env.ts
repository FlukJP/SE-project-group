import "dotenv/config";

// Check if we're in Next.js build phase (Vercel deployment)
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

// Returns the trimmed value of an environment variable, throwing if it is missing or empty.
function requireString(name: string): string {
    if (isBuildPhase) {
        // During build phase, return placeholder to avoid breaking the build
        return `PLACEHOLDER_${name}`;
    }
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Environment variable ${name} is required but not defined or empty`);
    }
    return value.trim();
}

// Returns the value of an environment variable as a positive integer, throwing if invalid.
function requirePositiveInt(name: string): number {
    if (isBuildPhase) {
        // During build phase, return placeholder to avoid breaking the build
        return 3600; // 1 hour placeholder
    }
    const raw = process.env[name];
    const value = Number(raw);
    if (!raw || isNaN(value) || !Number.isInteger(value) || value <= 0) {
        throw new Error(`Environment variable ${name} must be a positive integer (got "${raw}")`);
    }
    return value;
}

// Returns the value of an environment variable as a validated URL string, throwing if malformed.
function requireUrl(name: string): string {
    if (isBuildPhase) {
        // During build phase, return placeholder to avoid breaking the build
        return "https://placeholder.com";
    }
    const value = requireString(name);
    try {
        new URL(value);
    } catch {
        throw new Error(`Environment variable ${name} must be a valid URL (got "${value}")`);
    }
    return value;
}

// Server & Client
const PORT = process.env.PORT ? requirePositiveInt("PORT") : 5000;
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!NEXT_PUBLIC_API_URL) {
    throw new Error('Environment variable NEXT_PUBLIC_API_URL is required');
}
const SOCKET_URL = NEXT_PUBLIC_API_URL;
const CLIENT_URL = process.env.CLIENT_URL;

// JWT & Auth
const JWT_SECRET = requireString("JWT_SECRET");
const JWT_ISSUER = requireString("JWT_ISSUER");
const JWT_AUDIENCE = requireString("JWT_AUDIENCE");
const JWT_EXPIRES_IN = requirePositiveInt("JWT_EXPIRES_IN");
const JWT_REFRESH_SECRET = requireString("JWT_REFRESH_SECRET");
const JWT_REFRESH_EXPIRES_IN = requireString("JWT_REFRESH_EXPIRES_IN");
const OTP_EXPIRY = requirePositiveInt("OTP_EXPIRY");

// Database (MySQL)
const DB_HOST = requireString("DB_HOST");
const DB_USER = requireString("DB_USER");
const DB_NAME = requireString("DB_NAME");
const DB_PORT = requirePositiveInt("DB_PORT");
const DB_PASS = process.env.DB_PASS ?? "";
const DB_SSL_CA = process.env.DB_SSL_CA ?? 'ca.pem';

// Redis
const REDIS_URL = requireString("REDIS_URL");

// Email
const NODE_ENV = process.env.NODE_ENV || "development";
let EMAIL_USER = process.env.EMAIL_USER ?? "";
let EMAIL_PASS = process.env.EMAIL_PASS ?? "";
if (NODE_ENV === "production" && !isBuildPhase) {
    EMAIL_USER = requireString("EMAIL_USER");
    EMAIL_PASS = requireString("EMAIL_PASS");
}

// Firebase
const NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
const NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "";
const NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
const NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
const NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "";
const NEXT_PUBLIC_FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "";
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT ?? "";

// File Upload Limits
const PRODUCT_MAX_SIZE = requirePositiveInt("PRODUCT_MAX_SIZE");
const USER_MAX_SIZE = requirePositiveInt("USER_MAX_SIZE");

// Export all environment variables as a single object
export const ENV = {
    NODE_ENV,
    PORT,
    // Client
    SOCKET_URL,
    CLIENT_URL,
    NEXT_PUBLIC_API_URL,
    // JWT
    JWT_SECRET,
    JWT_ISSUER,
    JWT_AUDIENCE,
    JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN,
    OTP_EXPIRY,
    // Database
    DB_HOST,
    DB_USER,
    DB_PASS,
    DB_NAME,
    DB_PORT,
    DB_SSL_CA,
    // Redis
    REDIS_URL,
    // Email
    EMAIL_USER,
    EMAIL_PASS,
    // Firebase
    NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_SERVICE_ACCOUNT,
    // Uploads
    PRODUCT_MAX_SIZE,
    USER_MAX_SIZE
};