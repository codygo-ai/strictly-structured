"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { StructuredOutputGroup } from "~/types/structuredOutputGroups";
import { validateSchemaForGroup } from "~/lib/groupSchemaValidator";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const META_SCHEMA_URI = "http://json-schema.org/draft-07/schema#";
const EDITOR_MODEL_PATH = "schema.json";
const CUSTOM_MARKER_OWNER = "ssv-group-validator";
const DEBOUNCE_MS = 200;

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  selectedGroup: StructuredOutputGroup | null;
  fillHeight?: boolean;
  editorTheme?: "light" | "dark";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMonacoSeverity(monaco: any, severity: string): number {
  switch (severity) {
    case "error":
      return monaco.MarkerSeverity.Error;
    case "warning":
      return monaco.MarkerSeverity.Warning;
    default:
      return monaco.MarkerSeverity.Info;
  }
}

export function SchemaEditor({
  value,
  onChange,
  selectedGroup,
  fillHeight = false,
  editorTheme = "dark",
}: SchemaEditorProps) {
  const isLight = editorTheme === "light";
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  const handleBeforeMount = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (monaco: any) => {
      monacoRef.current = monaco;
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        enableSchemaRequest: false,
        schemas: [
          {
            uri: META_SCHEMA_URI,
            fileMatch: [EDITOR_MODEL_PATH],
          },
        ],
      });
    },
    []
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    const timer = setTimeout(() => {
      const model = editor.getModel();
      if (!model) return;

      const markers = validateSchemaForGroup(value, selectedGroup ?? undefined);
      const groupLabel = selectedGroup?.groupName ?? "provider";

      monaco.editor.setModelMarkers(
        model,
        CUSTOM_MARKER_OWNER,
        markers.map((m) => ({
          startLineNumber: m.startLineNumber,
          startColumn: m.startColumn,
          endLineNumber: m.endLineNumber,
          endColumn: m.endColumn,
          message: `[${groupLabel}] ${m.message}`,
          severity: toMonacoSeverity(monaco, m.severity),
          source: CUSTOM_MARKER_OWNER,
        }))
      );
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, selectedGroup, mounted]);

  return (
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
        defaultPath={EDITOR_MODEL_PATH}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        theme={isLight ? "vs" : "vs-dark"}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          contextmenu: true,
          copyWithSyntaxHighlighting: true,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}
