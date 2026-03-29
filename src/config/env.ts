import { z } from "zod";

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

    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().default(""),

    PRODUCT_MAX_SIZE: z.coerce.number().positive(),
    USER_MAX_SIZE: z.coerce.number().positive(),
});

type ServerEnv = z.infer<typeof serverSchema>;

type ServerRuntimeEnv = Omit<ServerEnv, "CLIENT_URLS" | "FIREBASE_PRIVATE_KEY"> & {
    CLIENT_URLS: string[];
    FIREBASE_PRIVATE_KEY: string;
};

let cachedServerEnv: ServerRuntimeEnv | null = null;

const getServerEnv = (): ServerRuntimeEnv => {
    if (cachedServerEnv) return cachedServerEnv;

    const parsedServerEnv = serverSchema.safeParse(process.env);

    if (!parsedServerEnv.success) {
        console.error("Invalid SERVER ENV:");
        console.error(parsedServerEnv.error.format());
        throw new Error("Invalid server environment variables");
    }

    const serverEnv = parsedServerEnv.data;
    const FIREBASE_PRIVATE_KEY = serverEnv.FIREBASE_PRIVATE_KEY
        ? serverEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : "";

    const CLIENT_URLS = Array.from(
        new Set([
            ...defaultLocalClientUrls,
            ...splitAndValidateUrls(serverEnv.CLIENT_URL, "CLIENT_URL"),
            ...splitAndValidateUrls(serverEnv.CLIENT_URLS, "CLIENT_URLS"),
        ])
    );

    cachedServerEnv = {
        ...serverEnv,
        CLIENT_URLS,
        FIREBASE_PRIVATE_KEY,
    };

    return cachedServerEnv;
};

export const SERVER_ENV = new Proxy({} as ServerRuntimeEnv, {
    get: (_target, prop: string) => getServerEnv()[prop as keyof ServerRuntimeEnv],
});
