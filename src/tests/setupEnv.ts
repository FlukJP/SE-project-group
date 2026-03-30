Object.assign(process.env, {
    NODE_ENV: process.env.NODE_ENV || "test",
    PORT: process.env.PORT || "5000",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
    CLIENT_URLS: process.env.CLIENT_URLS || "http://localhost:3000,http://localhost:3001",

    JWT_SECRET: process.env.JWT_SECRET || "test-secret-key-that-is-long-enough",
    JWT_ISSUER: process.env.JWT_ISSUER || "test-issuer",
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || "test-audience",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "3600",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "test-refresh-secret-key-that-is-long-enough",
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

    OTP_EXPIRY: process.env.OTP_EXPIRY || "300",

    DB_HOST: process.env.DB_HOST || "127.0.0.1",
    DB_USER: process.env.DB_USER || "root",
    DB_NAME: process.env.DB_NAME || "test_db",
    DB_PORT: process.env.DB_PORT || "3306",
    DB_PASS: process.env.DB_PASS || "",
    DB_SSL_CA: process.env.DB_SSL_CA || "ca.pem",

    REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",

    RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    EMAIL_FROM: process.env.EMAIL_FROM || "Marketplace <onboarding@resend.dev>",

    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",

    PRODUCT_MAX_SIZE: process.env.PRODUCT_MAX_SIZE || "5",
    USER_MAX_SIZE: process.env.USER_MAX_SIZE || "2",
});
