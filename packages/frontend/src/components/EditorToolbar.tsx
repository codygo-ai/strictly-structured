"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { EXAMPLE_SCHEMAS } from "~/data/exampleSchemas";

interface EditorToolbarProps {
  schema: string;
  onSchemaChange: (s: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function EditorToolbar({
  schema,
  onSchemaChange,
  fileInputRef,
}: EditorToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const examplesRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(schema);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable or permission denied — silent fail
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

  const handleClear = useCallback(() => {
    onSchemaChange("{}");
  }, [onSchemaChange]);

  const handleExampleSelect = useCallback(
    (exampleSchema: string) => {
      onSchemaChange(exampleSchema);
      setExamplesOpen(false);
    },
    [onSchemaChange],
  );

  // Click-outside for examples dropdown
  useEffect(() => {
    if (!examplesOpen) return;
    const handler = (e: MouseEvent) => {
      if (examplesRef.current && !examplesRef.current.contains(e.target as Node)) {
        setExamplesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [examplesOpen]);

  return (
    <div className="editor-toolbar">
      <button
        type="button"
        className={`editor-toolbar-btn ${copied ? "success" : ""}`}
        onClick={handleCopy}
      >
        {copied ? "Copied!" : "Copy"}
      </button>

      <button
        type="button"
        className="editor-toolbar-btn"
        onClick={handleDownload}
      >
        Download
      </button>

      <button
        type="button"
        className="editor-toolbar-btn"
        onClick={() => fileInputRef.current?.click()}
      >
        Upload
      </button>

      <div className="relative" ref={examplesRef}>
        <button
          type="button"
          className="editor-toolbar-btn"
          onClick={() => setExamplesOpen(!examplesOpen)}
        >
          Examples &#x25BE;
        </button>
        {examplesOpen && (
          <div className="examples-dropdown">
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
      </div>

      <button
        type="button"
        className="editor-toolbar-btn"
        onClick={handleClear}
      >
        Clear
      </button>
    </div>
  );
}
