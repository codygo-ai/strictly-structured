"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "~/lib/useAuth";

function getInitials(displayName: string | null, email: string | null): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function UserAvatarMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [open]);

  if (!user) return null;

  const initials = getInitials(user.displayName ?? null, user.email ?? null);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[var(--ds-border)] bg-[var(--ds-surface-subtle)] text-sm font-medium text-primary ring-offset-[var(--ds-surface)] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-primary">{initials}</span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] max-w-[18rem] rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] py-1 shadow-lg"
          role="menu"
        >
          <div className="border-b border-[var(--ds-border)] px-3 py-2">
            {user.displayName?.trim() && (
              <p className="truncate text-sm font-medium text-primary">
                {user.displayName}
              </p>
            )}
            {user.email && (
              <p className="truncate text-xs text-secondary mt-0.5">
                {user.email}
              </p>
            )}
            {!user.displayName?.trim() && !user.email && (
              <p className="text-xs text-secondary">Signed in</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-[var(--ds-surface-hover)]"
            role="menuitem"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
