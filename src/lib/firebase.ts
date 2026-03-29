import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { ENV } from "@/src/config/env";

// Firebase client-side config
const firebaseConfig = {
    apiKey: ENV.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: ENV.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Initializes the Firebase app once and exports the Auth instance for client-side use. */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firebaseAuth = getAuth(app);