import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { ENV } from "./env";


// Initializes Firebase Admin SDK using a local service account file if present,
// otherwise falls back to default initialization (e.g., Application Default Credentials).
const serviceAccountPath = path.resolve(process.cwd(), "firebase-service-account.json");
const storageBucket = ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const loadServiceAccount = (): admin.ServiceAccount | undefined => {
    if (!ENV.FIREBASE_SERVICE_ACCOUNT) return undefined;

    const rawValue = ENV.FIREBASE_SERVICE_ACCOUNT.trim();

    try {
        if (rawValue.startsWith("{")) {
            const parsed = JSON.parse(rawValue) as admin.ServiceAccount & { private_key?: string };
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
    let serviceAccount: object | undefined;

    if (ENV.FIREBASE_SERVICE_ACCOUNT) {
        // Production: support either a JSON string or a file path in the env var.
        serviceAccount = loadServiceAccount();
    } else if (fs.existsSync(serviceAccountPath)) {
        // Local dev: loaded from file
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            storageBucket,
        });
    } else {
        console.warn("No Firebase service account found. Firebase Admin initialized without credentials.");
        admin.initializeApp({ storageBucket });
    }
}

export default admin;
