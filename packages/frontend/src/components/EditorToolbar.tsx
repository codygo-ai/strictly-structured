"use client";

import { useState, useCallback } from "react";

interface EditorToolbarProps {
  schema: string;
  onSchemaChange: (s: string) => void;
}

export function EditorToolbar({
  schema,
  onSchemaChange,
}: EditorToolbarProps) {
  const [copied, setCopied] = useState(false);

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
        onClick={handleClear}
      >
        Clear
      </button>
    </div>
  );
}
