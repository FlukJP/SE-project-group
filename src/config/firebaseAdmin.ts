import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const serviceAccountPath = path.resolve(process.cwd(), "firebase_key.json");

if (!admin.apps.length) {
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } else {
        console.warn("firebase_key.json not found. Firebase Admin initialized without credentials.");
        admin.initializeApp();
    }
}

export default admin;
