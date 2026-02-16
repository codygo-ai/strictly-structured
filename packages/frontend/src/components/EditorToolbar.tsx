'use client';

import { useState, useCallback } from 'react';

import { Button } from '~/components/ui';

interface EditorToolbarProps {
  schema: string;
  onSchemaChange: (s: string) => void;
}

export function EditorToolbar({ schema, onSchemaChange }: EditorToolbarProps) {
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
    const blob = new Blob([schema], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [schema]);

  const handleClear = useCallback(() => {
    onSchemaChange('{}');
  }, [onSchemaChange]);

  return (
    <div className="editor-toolbar">
      <Button variant="toolbar" active={copied} onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </Button>

      <Button variant="toolbar" onClick={handleDownload}>
        Download
      </Button>

      <Button variant="toolbar" onClick={handleClear}>
        Clear
      </Button>
    </div>
  );
}
