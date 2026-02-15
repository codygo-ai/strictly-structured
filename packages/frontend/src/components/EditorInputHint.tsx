"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { EXAMPLE_SCHEMAS } from "~/data/exampleSchemas";
import { UploadIcon } from "~/components/icons/UploadIcon";
import { CopyIcon } from "~/components/icons/CopyIcon";
import { DownloadIcon } from "~/components/icons/DownloadIcon";
import { Tooltip } from "~/components/Tooltip";

interface EditorInputHintProps {
  schema: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSchemaChange: (schema: string) => void;
}

export function EditorInputHint({
  schema,
  fileInputRef,
  onSchemaChange,
}: EditorInputHintProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
    setMenuOpen(false);
  }, [fileInputRef]);

  const handleSample = useCallback(
    (s: string) => {
      onSchemaChange(s);
      setMenuOpen(false);
    },
    [onSchemaChange],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(schema);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
  }, [schema]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([schema], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [schema]);

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
    <span className="inline-flex items-center gap-3 text-xs text-muted whitespace-nowrap">
      <span className="relative" ref={menuRef}>
        <Tooltip content="Open / Load" position="bottom">
          <button
            type="button"
            className="text-muted hover:text-primary cursor-pointer transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Open or load schema"
          >
            <UploadIcon width={14} height={14} />
          </button>
        </Tooltip>
        {menuOpen && (
          <div className="examples-dropdown-header">
            <button type="button" className="load-upload" onClick={handleUpload}>
              Open local file&hellip;
              <span className="examples-desc">Load your structured output schema</span>
            </button>
            <div className="examples-dropdown-divider" />
            <div className="examples-samples-section">
              <div className="examples-dropdown-section-label">Samples</div>
              {EXAMPLE_SCHEMAS.map((ex) => (
                <button
                  key={ex.name}
                  type="button"
                  onClick={() => handleSample(ex.schema)}
                >
                  {ex.name}
                  <span className="examples-desc">{ex.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </span>
      <span className="text-border select-none">|</span>
      <Tooltip content="Copy schema" position="bottom">
        <button
          type="button"
          className="text-muted hover:text-primary cursor-pointer transition-colors"
          onClick={handleCopy}
          aria-label="Copy schema"
        >
          {copied ? "✓" : <CopyIcon width={14} height={14} />}
        </button>
      </Tooltip>
      <Tooltip content="Download JSON" position="bottom">
        <button
          type="button"
          className="text-muted hover:text-primary cursor-pointer transition-colors"
          onClick={handleDownload}
          aria-label="Download JSON"
        >
          <DownloadIcon width={14} height={14} />
        </button>
      </Tooltip>
    </span>
  );
}
