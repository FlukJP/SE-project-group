import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Initializes Firebase Admin SDK using a local service account file if present,
// otherwise falls back to default initialization (e.g., Application Default Credentials).
const serviceAccountPath = path.resolve(process.cwd(), "firebase-service-account.json");

if (!admin.apps.length) {
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } else {
        console.warn("firebase-service-account.json not found. Firebase Admin initialized without credentials.");
        admin.initializeApp();
    }
}

export default admin;
