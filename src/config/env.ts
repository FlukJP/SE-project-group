import "dotenv/config";

// Returns the trimmed value of an environment variable, throwing if it is missing or empty.
function requireString(name: string): string {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Environment variable ${name} is required but not defined or empty`);
    }
    return value.trim();
}

// Returns the value of an environment variable as a positive integer, throwing if invalid.
function requirePositiveInt(name: string): number {
    const raw = process.env[name];
    const value = Number(raw);
    if (!raw || isNaN(value) || !Number.isInteger(value) || value <= 0) {
        throw new Error(`Environment variable ${name} must be a positive integer (got "${raw}")`);
    }
    return value;
}

// Returns the value of an environment variable as a validated URL string, throwing if malformed.
function requireUrl(name: string): string {
    const value = requireString(name);
    try {
        new URL(value);
    } catch {
        throw new Error(`Environment variable ${name} must be a valid URL (got "${value}")`);
    }
    return value;
}

// JWT
const JWT_SECRET = requireString("JWT_SECRET");
const JWT_ISSUER = requireString("JWT_ISSUER");
const JWT_AUDIENCE = requireString("JWT_AUDIENCE");
const JWT_EXPIRES_IN = requirePositiveInt("JWT_EXPIRES_IN");
const JWT_REFRESH_SECRET = requireString("JWT_REFRESH_SECRET");
const JWT_REFRESH_EXPIRES_IN = requireString("JWT_REFRESH_EXPIRES_IN");

// Database
const DB_HOST = requireString("DB_HOST");
const DB_USER = requireString("DB_USER");
const DB_NAME = requireString("DB_NAME");
const DB_PORT = requirePositiveInt("DB_PORT");
// DB_PASS may be empty for local development
const DB_PASSWORD = process.env.DB_PASS ?? "";

// Client / Socket
const SOCKET_URL = requireUrl("NEXT_PUBLIC_API_URL");
const CLIENT_URL = requireString("CLIENT_URL");

// Email — optional in development, required in production
const NODE_ENV = process.env.NODE_ENV || "development";
let EMAIL_USER = process.env.EMAIL_USER ?? "";
let EMAIL_PASS = process.env.EMAIL_PASS ?? "";
if (NODE_ENV === "production") {
    EMAIL_USER = requireString("EMAIL_USER");
    EMAIL_PASS = requireString("EMAIL_PASS");
}

export const ENV = {
    NODE_ENV,
    // JWT
    JWT_SECRET,
    JWT_ISSUER,
    JWT_AUDIENCE,
    JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN,
    // Database
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT,
    // Client
    SOCKET_URL,
    CLIENT_URL,
    // Email
    EMAIL_USER,
    EMAIL_PASS,
};
