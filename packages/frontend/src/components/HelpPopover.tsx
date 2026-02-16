'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import { Tooltip } from '~/components/Tooltip';

export function HelpPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <div className="relative" ref={ref}>
      <Tooltip content="How to use" position="bottom">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:text-primary"
          aria-label="How to use"
          aria-expanded={open}
        >
          ?
        </button>
      </Tooltip>
      {open && (
        <div className="help-popover">
          <p className="text-xs font-semibold text-primary mb-2.5 pb-1.5 border-b border-border">
            How it works
          </p>
          <ol className="space-y-2 text-xs text-secondary list-decimal list-inside leading-relaxed">
            <li>Paste or upload a JSON Schema</li>
            <li>See which providers it&apos;s compatible with</li>
            <li>Fix issues and copy your corrected schema</li>
          </ol>
        </div>
      )}
    </div>
  );
}
