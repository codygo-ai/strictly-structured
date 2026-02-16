'use client';

import { useState, useRef, useEffect } from 'react';

import { Tooltip } from '~/components/Tooltip';
import { useAuth } from '~/lib/useAuth';

function getInitials(displayName: string | null, email: string | null): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (parts.length >= 2 && first && last) {
      return (first.charAt(0) + last.charAt(0)).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '?';
}

export function UserAvatarMenu() {
  const { user, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  if (!user) {
    return (
      <Tooltip content="Log in" position="bottom">
        <button
          type="button"
          onClick={() => void signIn()}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:text-primary"
          aria-label="Log in"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </Tooltip>
    );
  }

  const initials = getInitials(user.displayName ?? null, user.email ?? null);

  return (
    <div className="relative" ref={menuRef}>
      <Tooltip content="Account" position="bottom">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-(--ds-border) bg-(--ds-surface-subtle) text-sm font-medium text-primary ring-offset-(--ds-surface) focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
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
      </Tooltip>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-48 max-w-[18rem] rounded-md border border-(--ds-border) bg-(--ds-surface) py-1 shadow-lg"
          role="menu"
        >
          <div className="border-b border-(--ds-border) px-3 py-2">
            {user.displayName?.trim() && (
              <p className="truncate text-sm font-medium text-primary">{user.displayName}</p>
            )}
            {user.email && <p className="truncate text-xs text-secondary mt-0.5">{user.email}</p>}
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
            className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-(--ds-surface-hover)"
            role="menuitem"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
