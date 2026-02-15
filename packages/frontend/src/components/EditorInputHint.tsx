"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { EXAMPLE_SCHEMAS } from "~/data/exampleSchemas";

interface EditorInputHintProps {
  schema: string;
  onSchemaChange: (schema: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function EditorInputHint({
  schema,
  onSchemaChange,
  fileInputRef,
}: EditorInputHintProps) {
  const [loadOpen, setLoadOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const loadRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLSpanElement>(null);

  const handleExampleSelect = useCallback(
    (s: string) => {
      onSchemaChange(s);
      setLoadOpen(false);
    },
    [onSchemaChange],
  );

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
    setLoadOpen(false);
  }, [fileInputRef]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(schema);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
    setMenuOpen(false);
  }, [schema]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([schema], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.json";
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  }, [schema]);

  const handleClear = useCallback(() => {
    onSchemaChange("{}");
    setMenuOpen(false);
  }, [onSchemaChange]);

  // Click-outside for load dropdown
  useEffect(() => {
    if (!loadOpen) return;
    const handler = (e: MouseEvent) => {
      if (loadRef.current && !loadRef.current.contains(e.target as Node)) {
        setLoadOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [loadOpen]);

  // Click-outside for kebab menu
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
      <span className="relative" ref={loadRef}>
        <button
          type="button"
          className="text-muted hover:text-primary cursor-pointer transition-colors"
          onClick={() => setLoadOpen(!loadOpen)}
          aria-expanded={loadOpen}
        >
          Drop, Paste or Load <span className="text-sm">&#x25BE;</span>
        </button>
        {loadOpen && (
          <div className="examples-dropdown-header">
            <button type="button" className="load-upload" onClick={handleUpload}>
              Upload file&hellip;
            </button>
            <div className="examples-dropdown-divider" />
            <div className="examples-dropdown-section-label">Samples</div>
            {EXAMPLE_SCHEMAS.map((ex) => (
              <button
                key={ex.name}
                type="button"
                onClick={() => handleExampleSelect(ex.schema)}
              >
                {ex.name}
                <span className="examples-desc">{ex.description}</span>
              </button>
            ))}
          </div>
        )}
      </span>
      <span className="mx-2 text-border select-none">|</span>
      <span className="relative" ref={menuRef}>
        <button
          type="button"
          className="text-secondary hover:text-primary cursor-pointer transition-colors leading-none text-base font-bold"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="More actions"
          aria-expanded={menuOpen}
        >
          &#x22EE;
        </button>
        {menuOpen && (
          <div className="examples-dropdown-header">
            <button type="button" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy schema"}
            </button>
            <button type="button" onClick={handleDownload}>
              Download JSON
            </button>
            <div className="examples-dropdown-divider" />
            <button type="button" onClick={handleClear}>
              Clear editor
            </button>
          </div>
        )}
      </span>
    </span>
  );
}
