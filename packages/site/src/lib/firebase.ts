import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app =
  typeof window !== "undefined" &&
  firebaseConfig.apiKey &&
  firebaseConfig.appId
    ? initializeApp(firebaseConfig)
    : null;

let authInstance: ReturnType<typeof getAuth> | null = null;

export function getAuthSafe() {
  if (typeof window === "undefined" || !app) return null;
  if (!authInstance) authInstance = getAuth(app);
  return authInstance;
}

export function getAnalyticsSafe() {
  if (typeof window === "undefined" || !app) return null;
  return getAnalytics(app);
}

export { signInWithPopup, GoogleAuthProvider, onAuthStateChanged };
export type { User };
