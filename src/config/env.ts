import { z } from "zod";

// Base flags
const isClient = typeof window !== "undefined";
const runtimeNodeEnv = process.env.NODE_ENV ?? "development";
const defaultLocalApiUrl = "http://localhost:5000";
const defaultLocalClientUrls = ["http://localhost:3000", "http://localhost:3001"];

const splitAndValidateUrls = (value: string | undefined, label: string): string[] => {
    if (!value) return [];

    return value
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => {
            try {
                return new URL(url).toString().replace(/\/$/, "");
            } catch {
                throw new Error(`Invalid URL in ${label}: ${url}`);
            }
        });
};

// SCHEMAS
const serverSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    CLIENT_URL: z.string().default(defaultLocalClientUrls[0]),
    CLIENT_URLS: z.string().optional().default(""),

    JWT_SECRET: z.string().min(10),
    JWT_ISSUER: z.string(),
    JWT_AUDIENCE: z.string(),
    JWT_EXPIRES_IN: z.coerce.number().positive(),
    JWT_REFRESH_SECRET: z.string().min(10),
    JWT_REFRESH_EXPIRES_IN: z.string(),

    OTP_EXPIRY: z.coerce.number().positive(),

    DB_HOST: z.string(),
    DB_USER: z.string(),
    DB_NAME: z.string(),
    DB_PORT: z.coerce.number().positive(),
    DB_PASS: z.string().optional().default(""),
    DB_SSL_CA: z.string().optional().default("ca.pem"),

    REDIS_URL: z.string().url(),

    EMAIL_USER: z.string().email(),
    EMAIL_PASS: z.string().min(6),

    FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),

    PRODUCT_MAX_SIZE: z.coerce.number().positive(),
    USER_MAX_SIZE: z.coerce.number().positive(),
});

// Client schema ใช้ .default("") เพื่อไม่ให้ throw ตอน module load
// Next.js inline NEXT_PUBLIC_* ตอน build — ถ้า var ไม่ถูก set จะได้ "" แทน undefined
// แล้วค่อย warn ใน console แทนที่จะ crash ทั้ง app
const clientSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    NEXT_PUBLIC_API_URL: z.string().default(""),
    NEXT_PUBLIC_SOCKET_URL: z.string().default(""),
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().default(""),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().default(""),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().default(""),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().default(""),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().default(""),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().default(""),
});

// TYPES
type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

// PARSE
const _serverEnv = !isClient ? serverSchema.safeParse(process.env) : null;
const _clientEnv = clientSchema.safeParse(process.env);

// VALIDATION
if (!isClient && _serverEnv && !_serverEnv.success) {
    console.error("Invalid SERVER ENV:");
    console.error(_serverEnv.error.format());
    throw new Error("Invalid server environment variables");
}

// Client: warn แทน throw เพื่อไม่ crash app ทั้งหมด
if (_clientEnv.success && !_clientEnv.data.NEXT_PUBLIC_API_URL) {
    console.error(
        "NEXT_PUBLIC_API_URL is empty.\n");
}

// PARSED DATA
const serverEnv = (_serverEnv?.success ? _serverEnv.data : undefined) as ServerEnv | undefined;
const clientEnv = _clientEnv.success ? _clientEnv.data : ({} as ClientEnv);

const FIREBASE_PRIVATE_KEY =
    !isClient && serverEnv?.FIREBASE_PRIVATE_KEY
        ? serverEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : "";

const API_BASE =
    clientEnv.NEXT_PUBLIC_API_URL ||
    (runtimeNodeEnv === "development" ? defaultLocalApiUrl : "");

const SOCKET_URL = clientEnv.NEXT_PUBLIC_SOCKET_URL || API_BASE;

const CLIENT_URLS = !isClient
    ? Array.from(
        new Set([
            ...defaultLocalClientUrls,
            ...splitAndValidateUrls(serverEnv?.CLIENT_URL, "CLIENT_URL"),
            ...splitAndValidateUrls(serverEnv?.CLIENT_URLS, "CLIENT_URLS"),
        ])
    )
    : [];

if (_clientEnv.success && !API_BASE) {
    console.error(
        "NEXT_PUBLIC_API_URL is empty.\n" +
        "Set it in production so the frontend can reach the deployed backend."
    );
}

// ENV OBJECT
const _env = {
    ...clientEnv,
    ...(serverEnv ?? {}),
    API_BASE,
    SOCKET_URL,
    CLIENT_URLS,
    FIREBASE_PRIVATE_KEY,
} as ClientEnv &
    Partial<ServerEnv> & {
        API_BASE: string;
        SOCKET_URL: string;
        CLIENT_URLS: string[];
        FIREBASE_PRIVATE_KEY: string;
    };

// PROXY GUARD
const clientKeys = new Set([...Object.keys(clientEnv), "API_BASE", "SOCKET_URL"]);

export const ENV = new Proxy(_env, {
    get(target, prop: string) {
        if (isClient && !clientKeys.has(prop) && prop in target) {
            throw new Error(
                `Attempted to access server-only ENV "${prop}" on the client.`
            );
        }
        return target[prop as keyof typeof target];
    },
});
