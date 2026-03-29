import admin from "firebase-admin";
import { ENV } from "./serverEnv";

if (!admin.apps.length) {
    if (!ENV.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT is not set.\n" +
            "Please add the full Firebase service account JSON to your environment variables."
        );
    }

    let serviceAccount: admin.ServiceAccount;

    try {
        serviceAccount = JSON.parse(ENV.FIREBASE_SERVICE_ACCOUNT) as admin.ServiceAccount;
    } catch {
        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT contains invalid JSON.\n" +
            "Make sure the value is a valid stringified service account object."
        );
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

export default admin;
