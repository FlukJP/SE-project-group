import { z } from "zod";

const defaultLocalApiUrl = "http://localhost:5000";

const normalizeOrigin = (value: string): string => {
    const trimmed = value.trim().replace(/\/$/, "");
    return trimmed.replace(/\/api$/i, "");
};

const rawClientEnv = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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

type ClientEnv = z.infer<typeof clientSchema>;

const parsedClientEnv = clientSchema.safeParse(rawClientEnv);
const clientEnv = parsedClientEnv.success ? parsedClientEnv.data : ({} as ClientEnv);

const API_BASE = normalizeOrigin(clientEnv.NEXT_PUBLIC_API_URL || defaultLocalApiUrl);
const SOCKET_URL = normalizeOrigin(clientEnv.NEXT_PUBLIC_SOCKET_URL || API_BASE);

if (!clientEnv.NEXT_PUBLIC_API_URL) {
    console.warn(
        `NEXT_PUBLIC_API_URL is empty. Falling back to ${defaultLocalApiUrl}.`
    );
}

export const CLIENT_ENV = {
    ...clientEnv,
    API_BASE,
    SOCKET_URL,
} as ClientEnv & {
    API_BASE: string;
    SOCKET_URL: string;
};
