"use client";

import { useCallback, useRef, useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  getSupportedKeywordsForModel,
  getValidationIssuesForSelection,
  validateJsonSchema,
  JSON_SCHEMA_KEYWORDS,
} from "@ssv/schema-utils";
import type { CompatibilityData, ValidationIssue } from "@ssv/schema-utils";
import {
  getMonacoRangesForIssues,
  getMonacoRangesForSchemaErrors,
} from "~/lib/schemaSourceMap";

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

const MONACO_MARKER_OWNER = "ssv-selection";

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  onPaste: () => void;
  selectedModelIds?: string[];
  compatibilityData?: CompatibilityData | null;
  /** When true, editor fills container height (use inside flex container). */
  fillHeight?: boolean;
  /** When true, do not render the top action bar (Load/Paste); parent renders header. */
  noHeader?: boolean;
  /** Editor theme: "light" for light UI (e.g. validator page), "dark" default. */
  editorTheme?: "light" | "dark";
}

export function SchemaEditor({
  value,
  onChange,
  onPaste,
  selectedModelIds = [],
  compatibilityData = null,
  fillHeight = false,
  noHeader = false,
  editorTheme = "dark",
}: SchemaEditorProps) {
  const isLight = editorTheme === "light";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<unknown>(null);
  const monacoRef = useRef<unknown>(null);
  const [editorReady, setEditorReady] = useState(false);
  /** Ref used by completion provider so it always sees current keyword list (avoids stale closure). */
  const keywordsForCompletionRef = useRef<string[]>([...JSON_SCHEMA_KEYWORDS]);
  /** True when suggestions are narrowed to selected model groups. */
  const isNarrowedToSelectionRef = useRef(false);

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

  // Keep completion provider in sync: when no selection show all keywords, else show LCD.
  useEffect(() => {
    const narrowed = supportedKeywords != null && supportedKeywords.size > 0;
    const list = narrowed
      ? Array.from(supportedKeywords).sort()
      : [...JSON_SCHEMA_KEYWORDS];
    keywordsForCompletionRef.current = list;
    isNarrowedToSelectionRef.current = narrowed;
  }, [supportedKeywords]);

  const { schemaValidityErrors, selectionIssues } = useMemo(() => {
    const trimmed = (value || DEFAULT_SCHEMA).trim();
    const noValidityErrors: Array<{ path: string; message: string }> = [];
    const noSelection: ValidationIssue[] = [];

    if (!trimmed) return { schemaValidityErrors: noValidityErrors, selectionIssues: noSelection };

    let parsed: object;
    try {
      parsed = JSON.parse(trimmed) as object;
    } catch {
      return { schemaValidityErrors: noValidityErrors, selectionIssues: noSelection };
    }

    const result = validateJsonSchema(parsed);
    if (!result.valid) {
      return { schemaValidityErrors: result.errors, selectionIssues: noSelection };
    }

    const selectionIssuesList =
      compatibilityData && selectedModelIds.length > 0
        ? getValidationIssuesForSelection(
            parsed,
            selectedModelIds,
            compatibilityData
          )
        : noSelection;
    return { schemaValidityErrors: noValidityErrors, selectionIssues: selectionIssuesList };
  }, [value, selectedModelIds, compatibilityData]);

  useEffect(() => {
    const editor = editorRef.current as { getModel?: () => { uri?: unknown } } | null;
    const monaco = monacoRef.current as {
      editor?: { setModelMarkers: (model: unknown, owner: string, markers: Array<{ startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number; message: string; severity: number }>) => void };
      MarkerSeverity?: { Error: number; Warning: number };
    } | null;
    if (!editor?.getModel || !monaco?.editor) return;

    const schemaString = value || DEFAULT_SCHEMA;
    const errorSeverity = monaco.MarkerSeverity?.Error ?? 8;
    const warningSeverity = monaco.MarkerSeverity?.Warning ?? 4;

    const schemaMarkers = getMonacoRangesForSchemaErrors(
      schemaString,
      schemaValidityErrors
    ).map((d) => ({ ...d.range, message: d.message, severity: errorSeverity }));

    const selectionMarkers = getMonacoRangesForIssues(
      schemaString,
      selectionIssues
    ).map((d) => ({ ...d.range, message: d.message, severity: warningSeverity }));

    const markers = [...schemaMarkers, ...selectionMarkers];

    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelMarkers(model, MONACO_MARKER_OWNER, markers);
    }
  }, [value, schemaValidityErrors, selectionIssues, editorReady]);

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
    (editor: any, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      setEditorReady(true);

      // Cmd+P / Ctrl+P opens command palette
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP,
        () => {
          editor.trigger("keyboard", "editor.action.quickCommand", null);
        }
      );

      // Context menu: Pretty print (format) JSON
      editor.addAction({
        id: "editor.action.formatDocument.json",
        label: "Pretty print (format)",
        contextMenuGroupId: "1_modification",
        contextMenuOrder: 1.5,
        run: () => {
          const model = editor.getModel();
          if (!model) return;
          const text = model.getValue();
          const trimmed = text.trim();
          if (!trimmed) return;
          try {
            const parsed = JSON.parse(trimmed);
            const formatted = JSON.stringify(parsed, null, 2);
            editor.executeEdits("pretty-print", [
              { range: model.getFullModelRange(), text: formatted },
            ]);
          } catch {
            // Invalid JSON: try built-in format if available
            const formatAction = editor.getAction?.("editor.action.formatDocument");
            if (formatAction?.run) formatAction.run();
          }
        },
      });

      // Always register: provider reads from keywordsForCompletionRef (updated when selection/data changes).
      monaco.languages.registerCompletionItemProvider("json", {
        triggerCharacters: ['"'],
        provideCompletionItems: (
          model: { getWordUntilPosition: (p: { lineNumber: number; column: number }) => { startColumn: number; endColumn: number } },
          position: { lineNumber: number; column: number }
        ) => {
          const keywords = keywordsForCompletionRef.current.length > 0
            ? keywordsForCompletionRef.current
            : [...JSON_SCHEMA_KEYWORDS];
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const narrowed = isNarrowedToSelectionRef.current;
          const suggestions = keywords.map((keyword) => ({
            label: `"${keyword}"`,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: `"${keyword}"`,
            detail: narrowed
              ? KEYWORD_DOC[keyword] ?? `JSON Schema: ${keyword}`
              : (KEYWORD_DOC[keyword] ?? `JSON Schema: ${keyword}`) + " — Select model groups to narrow.",
            range,
          }));
          return { suggestions };
        },
      });
    },
    []
  );

  const editorContent = (
    <div
      className={
        fillHeight
          ? `flex-1 min-h-0 rounded-lg overflow-hidden flex flex-col ${
              isLight
                ? "border border-border bg-surface"
                : "border border-(--card-border) bg-[#1e1e1e]"
            }`
          : `rounded-lg overflow-hidden min-h-[280px] ${
              isLight
                ? "border border-border bg-surface"
                : "border border-(--card-border) bg-[#1e1e1e]"
            }`
      }
    >
      <Monaco
        height={fillHeight ? "100%" : "280px"}
        defaultLanguage="json"
        value={value || DEFAULT_SCHEMA}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleEditorMount}
        theme={isLight ? "vs" : "vs-dark"}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          contextmenu: true,
          copyWithSyntaxHighlighting: true,
        }}
      />
    </div>
  );

  return (
    <div className={fillHeight ? "flex flex-col min-h-0 flex-1" : "space-y-2"}>
      {!noHeader && (
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
      )}
      {editorContent}
    </div>
  );
}
