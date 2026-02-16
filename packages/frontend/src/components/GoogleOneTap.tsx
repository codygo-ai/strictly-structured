'use client';

import { useEffect, useRef } from 'react';

import {
  getAuthSafe,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
} from '~/lib/firebase';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

/**
 * Loads Google Identity Services and shows One Tap when the user is not signed in.
 * Uses the same Web client ID as Firebase Google sign-in (same project).
 */
export function GoogleOneTap() {
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const auth = getAuthSafe();
    if (!auth) return;

    let cancelled = false;

    function handleCredentialResponse(response: { credential: string }) {
      const credential = GoogleAuthProvider.credential(response.credential);
      signInWithCredential(auth!, credential)
        .then(() => {
          if (typeof google !== 'undefined' && google.accounts?.id?.cancel) {
            google.accounts.id.cancel();
          }
        })
        .catch((error) => {
          if (typeof google !== 'undefined' && google.accounts?.id?.cancel) {
            google.accounts.id.cancel();
          }
          console.warn(
            { error },
            `Google One Tap sign-in failed: ${(error as Error)?.message ?? 'unknown'}`,
          );
        });
    }

    function loadScript(): Promise<void> {
      if (document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = GIS_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
      });
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    loadScript()
      .then(() => {
        if (cancelled || initialized.current) return;
        if (typeof google === 'undefined' || !google.accounts?.id?.initialize) return;

        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          cancel_on_tap_outside: true,
        });
        initialized.current = true;

        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (cancelled || user || typeof google === 'undefined' || !google.accounts?.id?.prompt)
            return;
          timeoutId = setTimeout(() => {
            if (cancelled) return;
            google.accounts.id.prompt((notification) => {
              const type = notification.getMomentType();
              if (type === 'skipped') {
                if (typeof google !== 'undefined' && google.accounts?.id?.cancel) {
                  google.accounts.id.cancel();
                }
              } else if (
                type === 'dismissed' &&
                notification.getDismissedReason?.() !== 'credential_returned'
              ) {
                if (typeof google !== 'undefined' && google.accounts?.id?.cancel) {
                  google.accounts.id.cancel();
                }
              }
            });
          }, 300);
        });
      })
      .catch((error) => {
        console.warn(
          { error },
          `Google One Tap script load failed: ${(error as Error)?.message ?? 'unknown'}`,
        );
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
