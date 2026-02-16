'use client';

import metaSchema from '@ssv/schemas/data/versionAggregatedJsonSchema.json';
import type { SchemaMarker } from '@ssv/schemas/ruleSetValidator';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';

const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const META_SCHEMA_URI = 'http://json-schema.org/draft-07/schema#';
const EDITOR_MODEL_PATH = 'schema.json';
const CUSTOM_MARKER_OWNER = 'ssv-ruleset-validator';

export interface SchemaEditorApi {
  scrollToLine: (line: number) => void;
  applyText: (text: string) => void;
}

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  markers?: SchemaMarker[];
  markerLabel?: string;
  fillHeight?: boolean;
  onEditorReady?: (api: SchemaEditorApi) => void;
  onSchemaValidation?: (hasErrors: boolean) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMonacoSeverity(monaco: any, severity: string): number {
  switch (severity) {
    case 'error':
      return monaco.MarkerSeverity.Error;
    case 'warning':
      return monaco.MarkerSeverity.Warning;
    default:
      return monaco.MarkerSeverity.Info;
  }
}

export function SchemaEditor({
  value,
  onChange,
  markers,
  markerLabel = 'provider',
  fillHeight = false,
  onEditorReady,
  onSchemaValidation,
}: SchemaEditorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
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
            schema: metaSchema,
          },
        ],
      });
    },
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor;
    setMounted(true);

    if (onEditorReady) {
      onEditorReady({
        scrollToLine: (line: number) => {
          editor.revealLineInCenter(line);
          editor.setPosition({ lineNumber: line, column: 1 });
          editor.focus();
        },
        applyText: (text: string) => {
          const model = editor.getModel();
          if (!model) return;
          const fullRange = model.getFullModelRange();
          editor.pushUndoStop();
          editor.executeEdits('fix-all', [{ range: fullRange, text }]);
          editor.pushUndoStop();
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture onEditorReady at mount time only
  }, []);

  // Listen to Monaco's built-in JSON/meta-schema diagnostics
  useEffect(() => {
    if (!mounted) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    const model = editor.getModel();
    if (!model) return;

    const disposable = monaco.editor.onDidChangeMarkers((uris: unknown[]) => {
      const modelUri = model.uri.toString();
      const affected = (uris as { toString(): string }[]).some((u) => u.toString() === modelUri);
      if (!affected) return;

      const allMarkers = monaco.editor.getModelMarkers({ resource: model.uri });
      const builtinErrors = allMarkers.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any) => m.owner !== CUSTOM_MARKER_OWNER && m.severity === monaco.MarkerSeverity.Error,
      );
      onSchemaValidation?.(builtinErrors.length > 0);
    });

    // Fire once immediately so the initial state is correct
    const allMarkers = monaco.editor.getModelMarkers({ resource: model.uri });
    const builtinErrors = allMarkers.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) => m.owner !== CUSTOM_MARKER_OWNER && m.severity === monaco.MarkerSeverity.Error,
    );
    onSchemaValidation?.(builtinErrors.length > 0);

    return () => disposable.dispose();
  }, [mounted, onSchemaValidation]);

  // Apply markers from parent
  useEffect(() => {
    if (!mounted) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    const model = editor.getModel();
    if (!model) return;

    const monacoMarkers = (markers ?? []).map((m) => ({
      startLineNumber: m.startLineNumber,
      startColumn: m.startColumn,
      endLineNumber: m.endLineNumber,
      endColumn: m.endColumn,
      message: `[${markerLabel}] ${m.message}`,
      severity: toMonacoSeverity(monaco, m.severity),
      source: CUSTOM_MARKER_OWNER,
    }));

    monaco.editor.setModelMarkers(model, CUSTOM_MARKER_OWNER, monacoMarkers);
  }, [markers, markerLabel, mounted]);

  return (
    <div
      className={
        fillHeight
          ? 'flex-1 min-h-0 rounded-t-lg overflow-hidden flex flex-col border border-b-0 border-border bg-surface shadow-sm'
          : 'rounded-t-lg overflow-hidden min-h-[280px] border border-b-0 border-border bg-surface shadow-sm'
      }
    >
      <Monaco
        height={fillHeight ? '100%' : '280px'}
        defaultLanguage="json"
        defaultPath={EDITOR_MODEL_PATH}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        theme={isDark ? 'vs-dark' : 'vs'}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          contextmenu: true,
          copyWithSyntaxHighlighting: true,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}
