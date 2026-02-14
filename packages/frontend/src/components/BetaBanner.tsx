"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "ssv-beta-banner-dismissed";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === null;
}

function getServerSnapshot() {
  return false;
}

export function BetaBanner() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    // Force re-render since storage event only fires cross-tab
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const handleFeedbackClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent("ssv:open-feedback"));
    handleDismiss();
  }, [handleDismiss]);

  if (!visible) return null;

  return (
    <div className="bg-accent text-white text-sm text-center py-1.5 px-4 relative z-50">
      <span>
        This is an early beta &mdash; we&apos;d love your{" "}
        <button
          type="button"
          onClick={handleFeedbackClick}
          className="underline font-medium hover:opacity-80 cursor-pointer"
        >
          feedback
        </button>
        !
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white cursor-pointer"
        aria-label="Dismiss banner"
      >
        &#x2715;
      </button>
    </div>
  );
}
