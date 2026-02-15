"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-border text-muted hover:text-primary hover:border-accent text-xs font-medium transition-colors cursor-pointer"
        aria-label="How to use"
        aria-expanded={open}
      >
        ?
      </button>
      {open && (
        <div className="help-popover">
          <p className="text-xs font-semibold text-primary mb-2.5 pb-1.5 border-b border-border">How it works</p>
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
