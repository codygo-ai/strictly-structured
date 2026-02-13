"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAuthSafe,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "~/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthSafe();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    const auth = getAuthSafe();
    if (!auth) throw new Error("Firebase Auth not available");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    const auth = getAuthSafe();
    if (!auth) return;
    await auth.signOut();
  }, []);

  /** Returns a valid ID token. If not signed in, opens sign-in and waits, then returns token. */
  const ensureAuth = useCallback(async (): Promise<string> => {
    const auth = getAuthSafe();
    if (!auth) throw new Error("Firebase Auth not available");
    const currentUser = auth.currentUser;
    if (currentUser) {
      return currentUser.getIdToken(true);
    }
    await signInWithPopup(auth, new GoogleAuthProvider());
    const afterUser = auth.currentUser;
    if (!afterUser) throw new Error("Sign-in did not complete");
    return afterUser.getIdToken(true);
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    const u = user ?? getAuthSafe()?.currentUser ?? null;
    if (!u) return null;
    return u.getIdToken(true);
  }, [user]);

  return { user, loading, signIn, signOut, ensureAuth, getIdToken };
}
