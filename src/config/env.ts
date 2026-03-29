import { z } from "zod";

// Base flags
const isClient = typeof window !== "undefined";

// ZOD SCHEMAS
// Server-only ENV
const serverSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    PORT: z.coerce.number().int().positive().default(5000),

    CLIENT_URL: z.string().url(),

    // JWT
    JWT_SECRET: z.string().min(10),
    JWT_ISSUER: z.string(),
    JWT_AUDIENCE: z.string(),
    JWT_EXPIRES_IN: z.coerce.number().positive(),

    JWT_REFRESH_SECRET: z.string().min(10),
    JWT_REFRESH_EXPIRES_IN: z.string(),

    OTP_EXPIRY: z.coerce.number().positive(),

    // DB
    DB_HOST: z.string(),
    DB_USER: z.string(),
    DB_NAME: z.string(),
    DB_PORT: z.coerce.number().positive(),
    DB_PASS: z.string().optional().default(""),
    DB_SSL_CA: z.string().optional().default("ca.pem"),

    REDIS_URL: z.string().url(),

    // Email
    EMAIL_USER: z.string().email(),
    EMAIL_PASS: z.string().min(6),

    // Firebase Admin
    FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),

    // Upload limits
    PRODUCT_MAX_SIZE: z.coerce.number().positive(),
    USER_MAX_SIZE: z.coerce.number().positive(),
});

// Client-safe ENV
const clientSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    NEXT_PUBLIC_API_URL: z.string().url(),

    NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string(),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
});

// TYPES
type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

// PARSE ENV
const _serverEnv = !isClient ? serverSchema.safeParse(process.env) : null;
const _clientEnv = clientSchema.safeParse(process.env);


// ERROR HANDLING
if (!isClient && _serverEnv && !_serverEnv.success) {
    console.error("Invalid SERVER ENV:");
    console.error(_serverEnv.error.format());
    throw new Error("Invalid server environment variables");
}

if (!_clientEnv.success) {
    console.error("Invalid CLIENT ENV:");
    console.error(_clientEnv.error.format());
    throw new Error("Invalid client environment variables");
}

// PARSED DATA
const serverEnv = (_serverEnv?.success ? _serverEnv.data : undefined) as ServerEnv | undefined;
const clientEnv = _clientEnv.data;

// Fix Firebase private key newline
const FIREBASE_PRIVATE_KEY =
    !isClient && serverEnv?.FIREBASE_PRIVATE_KEY
        ? serverEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : "";

// RAW ENV OBJECT
const _env = {
    ...clientEnv,
    ...(serverEnv ?? {}),

    // derived
    SOCKET_URL: clientEnv.NEXT_PUBLIC_API_URL,

    // override FIREBASE_PRIVATE_KEY ด้วยตัวที่แก้ newline แล้ว
    FIREBASE_PRIVATE_KEY,
} as ClientEnv & Partial<ServerEnv> & { SOCKET_URL: string; FIREBASE_PRIVATE_KEY: string };

// PROXY GUARD
const clientKeys = new Set(Object.keys(clientEnv));

export const ENV = new Proxy(_env, {
    get(target, prop: string) {
        if (isClient && !clientKeys.has(prop) && prop in target) {
            throw new Error(
                `❌ Attempted to access server-only ENV "${prop}" on the client.\n` +
                `Only NEXT_PUBLIC_* variables are available in the browser.`
            );
        }
        return target[prop as keyof typeof target];
    },
});