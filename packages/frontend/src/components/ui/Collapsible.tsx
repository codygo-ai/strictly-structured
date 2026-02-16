'use client';

import { useState } from 'react';

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Collapsible({ title, defaultOpen = false, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-1.5 text-[10.5px] font-bold tracking-wider uppercase text-muted mt-4 mb-0 pb-2 border-b border-transparent hover:text-secondary bg-transparent cursor-pointer p-0 transition-colors"
        style={{ borderBottomColor: open ? 'var(--ds-border)' : 'transparent' }}
      >
        <span
          aria-hidden
          className="inline-block text-[9px] transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          &#x25B6;
        </span>
        {title}
      </button>
      {open && <div className="mt-1.5">{children}</div>}
    </div>
  );
}
