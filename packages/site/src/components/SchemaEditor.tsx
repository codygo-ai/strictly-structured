"use client";

import { useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { getSupportedKeywordsForModel } from "@ssv/schema-utils";
import type { CompatibilityData } from "@ssv/schema-utils";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DEFAULT_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "count": { "type": "integer" }
  },
  "required": ["name"]
}
`;

const KEYWORD_DOC: Record<string, string> = {
  type: "JSON type: string, number, integer, boolean, array, object, null",
  enum: "Enumeration of allowed values",
  const: "Single allowed value",
  properties: "Object properties",
  required: "Required property names",
  additionalProperties: "Allow additional properties",
  patternProperties: "Pattern-matched properties",
  items: "Array items schema",
  prefixItems: "Tuple item schemas",
  minItems: "Minimum array length",
  maxItems: "Maximum array length",
  uniqueItems: "Require unique array items",
  minLength: "Minimum string length",
  maxLength: "Maximum string length",
  pattern: "Regex pattern",
  format: "Format (e.g. date-time, uri)",
  minimum: "Minimum number",
  maximum: "Maximum number",
  oneOf: "Exactly one of these schemas",
  anyOf: "At least one of these schemas",
  allOf: "All of these schemas",
  not: "Must not match schema",
  $ref: "Reference to $defs",
  $defs: "Schema definitions",
  title: "Title",
  description: "Description",
};

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  onPaste: () => void;
  selectedModelIds?: string[];
  compatibilityData?: CompatibilityData | null;
}

export function SchemaEditor({
  value,
  onChange,
  onPaste,
  selectedModelIds = [],
  compatibilityData = null,
}: SchemaEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedKeywords = useMemo(() => {
    if (!compatibilityData || selectedModelIds.length === 0)
      return null;
    let set: Set<string> | null = null;
    for (const modelId of selectedModelIds) {
      const kw = getSupportedKeywordsForModel(modelId, compatibilityData);
      if (kw.size === 0) continue;
      if (set === null) set = new Set(kw);
      else {
        const next = new Set<string>();
        for (const k of set) if (kw.has(k)) next.add(k);
        set = next;
      }
    }
    return set;
  }, [compatibilityData, selectedModelIds]);

  const handleLoadFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text === "string") onChange(text);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [onChange]
  );

  const handleEditorMount = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_editor: unknown, monaco: any) => {
      if (!supportedKeywords || supportedKeywords.size === 0) return;
      const keywords = Array.from(supportedKeywords).sort();
      monaco.languages.registerCompletionItemProvider("json", {
        triggerCharacters: ['"'],
        provideCompletionItems: (model: { getWordUntilPosition: (p: { lineNumber: number; column: number }) => { startColumn: number; endColumn: number } }, position: { lineNumber: number; column: number }) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const suggestions = keywords.map((keyword) => ({
            label: `"${keyword}"`,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: `"${keyword}"`,
            detail: KEYWORD_DOC[keyword] ?? `JSON Schema: ${keyword}`,
            range,
          }));
          return { suggestions };
        },
      });
    },
    [supportedKeywords]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm font-medium text-zinc-300">
          JSON Schema
        </span>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handleLoadFile}
            className="px-3 py-1.5 text-sm rounded-md bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
          >
            Load from file
          </button>
          <button
            type="button"
            onClick={onPaste}
            className="px-3 py-1.5 text-sm rounded-md bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
          >
            Paste
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-[var(--card-border)] overflow-hidden bg-[#1e1e1e] min-h-[280px]">
        <Monaco
          height="280px"
          defaultLanguage="json"
          value={value || DEFAULT_SCHEMA}
          onChange={(v) => onChange(v ?? "")}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
