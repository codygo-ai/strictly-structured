import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

/** Firebase client config (public; safe to embed). */
const firebaseConfig = {
  // cspell:disable-next-line
  apiKey: "AIzaSyCxkbcNcv0LvseHtMu5fsh3UixX4q_6fBM",
  authDomain: "codygo-website.firebaseapp.com",
  projectId: "codygo-website",
  storageBucket: "codygo-website.appspot.com",
  messagingSenderId: "518648006371",
  appId: "1:518648006371:web:aeaf1060951b6af31fa7d6",
  measurementId: "G-E0XCL0J9N0",
};

export const app =
  typeof window !== "undefined" ? initializeApp(firebaseConfig) : null;

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

export {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
};
export type { User };
