"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const CYCLE: ("light" | "dark")[] = ["light", "dark"];

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  function handleClick() {
    const resolved = theme === "dark" ? "dark" : "light";
    const current = CYCLE.indexOf(resolved);
    const next = CYCLE[(current + 1) % CYCLE.length]!;
    setTheme(next);
  }

  if (!mounted) {
    return <div className="size-8" />;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex size-8 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
      title={theme === "dark" ? "Dark" : "Light"}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}
