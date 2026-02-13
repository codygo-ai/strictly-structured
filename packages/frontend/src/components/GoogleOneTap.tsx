"use client";

import { useEffect, useRef } from "react";
import {
  getAuthSafe,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "~/lib/firebase";

const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";

/**
 * Loads Google Identity Services and shows One Tap when the user is not signed in.
 * Uses the same Web client ID as Firebase Google sign-in (same project).
 */
export function GoogleOneTap() {
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const auth = getAuthSafe();
    if (!auth) return;

    function handleCredentialResponse(response: { credential: string }) {
      const credential = GoogleAuthProvider.credential(response.credential);
      signInWithCredential(auth!, credential).catch(() => {
        // Ignore errors (e.g. user already signed in, or cancelled)
      });
      if (typeof google !== "undefined" && google.accounts?.id?.cancel) {
        google.accounts.id.cancel();
      }
    }

    function loadScript(): Promise<void> {
      if (document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = GIS_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to load Google Identity Services"));
        document.head.appendChild(script);
      });
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    loadScript()
      .then(() => {
        if (initialized.current) return;
        if (typeof google === "undefined" || !google.accounts?.id?.initialize)
          return;

        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          cancel_on_tap_outside: true,
        });
        initialized.current = true;

        // Show One Tap only after auth state is known and user is not signed in
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (
            user ||
            typeof google === "undefined" ||
            !google.accounts?.id?.prompt
          )
            return;
          timeoutId = setTimeout(() => {
            google.accounts.id.prompt();
          }, 300);
        });
      })
      .catch(() => {});

    return () => {
      unsubscribe?.();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
