import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Initializes Firebase Admin SDK using a local service account file if present,
// otherwise falls back to default initialization (e.g., Application Default Credentials).
const serviceAccountPath = path.resolve(process.cwd(), "firebase-service-account.json");
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!admin.apps.length) {
    let serviceAccount: object | undefined;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Production: loaded from environment variable (JSON string)
        const keyPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
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
