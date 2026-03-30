import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { SERVER_ENV as ENV } from "@/src/config/env";

const serviceAccountPath = path.resolve(process.cwd(), "firebase-service-account.json");

const normalizeBucketName = (value: string | undefined): string => {
    if (!value) return "";

    const trimmed = value.trim();
    if (!trimmed) return "";

    const withoutProtocol = trimmed.replace(/^gs:\/\//i, "");

    try {
        const parsed = new URL(trimmed);
        return parsed.hostname;
    } catch {
        return withoutProtocol.replace(/\/+$/, "");
    }
};

const storageBucket = normalizeBucketName(
    ENV.FIREBASE_STORAGE_BUCKET || ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

const loadServiceAccount = (): admin.ServiceAccount | undefined => {
    if (!ENV.FIREBASE_SERVICE_ACCOUNT) return undefined;

    const rawValue = ENV.FIREBASE_SERVICE_ACCOUNT.trim();

    try {
        if (rawValue.startsWith("{")) {
            const parsed = JSON.parse(rawValue) as admin.ServiceAccount & {
                private_key?: string;
            };

            if (parsed.private_key) {
                parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
            }

            return parsed;
        }

        const keyPath = path.resolve(rawValue);
        return JSON.parse(fs.readFileSync(keyPath, "utf8")) as admin.ServiceAccount;
    } catch (error) {
        console.error("[FirebaseAdmin] Failed to load FIREBASE_SERVICE_ACCOUNT");
        if (error instanceof Error) {
            console.error(error.message);
        }
        return undefined;
    }
};

if (!admin.apps.length) {
    let serviceAccount: admin.ServiceAccount | undefined;

    if (ENV.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = loadServiceAccount();
    } else if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(
            fs.readFileSync(serviceAccountPath, "utf-8")
        ) as admin.ServiceAccount;
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket,
        });
    } else {
        console.warn(
            "No Firebase service account found. Firebase Admin initialized without credentials."
        );
        admin.initializeApp({ storageBucket });
    }
}

export default admin;
