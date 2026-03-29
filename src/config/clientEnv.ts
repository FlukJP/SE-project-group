import { z } from "zod";

const runtimeNodeEnv = process.env.NODE_ENV ?? "development";
const defaultLocalApiUrl = "http://localhost:5000";

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

const parsedClientEnv = clientSchema.safeParse(process.env);
const clientEnv = parsedClientEnv.success ? parsedClientEnv.data : ({} as ClientEnv);

const API_BASE =
    clientEnv.NEXT_PUBLIC_API_URL ||
    (runtimeNodeEnv === "development" ? defaultLocalApiUrl : "");

const SOCKET_URL = clientEnv.NEXT_PUBLIC_SOCKET_URL || API_BASE;

if (!API_BASE) {
    console.error(
        "NEXT_PUBLIC_API_URL is empty.\n" +
        "Set it in production so the frontend can reach the deployed backend."
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

export const ENV = CLIENT_ENV;
