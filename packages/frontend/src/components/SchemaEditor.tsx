"use client";

import { useCallback, useEffect, useRef } from "react";
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
  /** Optional JSON Schema (e.g. group meta-schema) to validate the document. Applied when selected group changes. */
  validationSchema?: object | null;
}

export function SchemaEditor({
  value,
  onChange,
  onPaste,
  fillHeight = false,
  noHeader = false,
  editorTheme = "dark",
  validationSchema = null,
}: SchemaEditorProps) {
  const isLight = editorTheme === "light";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const monacoRef = useRef<unknown>(null);

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

  const applyValidationSchema = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (monaco: any, schema: object | null | undefined) => {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas:
          schema != null
            ? [
                {
                  uri: "https://group-meta-schema",
                  fileMatch: ["*"],
                  schema,
                },
              ]
            : [],
      });
    },
    []
  );

  const handleBeforeMount = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (monaco: any) => {
      monacoRef.current = monaco;
      applyValidationSchema(monaco, validationSchema ?? null);
    },
    [validationSchema, applyValidationSchema]
  );

  const handleEditorMount = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor: any, monaco: any) => {
      applyValidationSchema(monaco, validationSchema ?? null);

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
    },
    [validationSchema, applyValidationSchema]
  );

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    applyValidationSchema(monaco, validationSchema ?? null);
  }, [validationSchema, applyValidationSchema]);

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
        beforeMount={handleBeforeMount}
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
