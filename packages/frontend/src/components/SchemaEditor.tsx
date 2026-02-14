"use client";

import { useCallback, useRef } from "react";
import dynamic from "next/dynamic";

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

const JSON_SCHEMA_KEYWORDS = [
  "type", "enum", "const", "properties", "required", "additionalProperties",
  "items", "description", "title", "minimum", "maximum", "pattern", "format",
  "oneOf", "anyOf", "allOf", "not", "$ref", "$defs",
];

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  onPaste: () => void;
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
  fillHeight = false,
  noHeader = false,
  editorTheme = "dark",
}: SchemaEditorProps) {
  const isLight = editorTheme === "light";
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP,
        () => {
          editor.trigger("keyboard", "editor.action.quickCommand", null);
        }
      );

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
            const formatAction = editor.getAction?.("editor.action.formatDocument");
            if (formatAction?.run) formatAction.run();
          }
        },
      });

      monaco.languages.registerCompletionItemProvider("json", {
        triggerCharacters: ['"'],
        provideCompletionItems: (
          model: { getWordUntilPosition: (p: { lineNumber: number; column: number }) => { startColumn: number; endColumn: number } },
          position: { lineNumber: number; column: number }
        ) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const suggestions = JSON_SCHEMA_KEYWORDS.map((keyword) => ({
            label: `"${keyword}"`,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: `"${keyword}"`,
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
