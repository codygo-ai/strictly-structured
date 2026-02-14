"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { SiteHeader } from "~/components/SiteHeader";
import { SchemaEditor } from "~/components/SchemaEditor";
import { ValidationResults } from "~/components/ValidationResults";
import type { ValidationResult } from "~/lib/providers/types";
import { RightPane } from "~/components/RightPane";
import { OpenAIIcon } from "~/components/icons/OpenAIIcon";
import { ClaudeIcon } from "~/components/icons/ClaudeIcon";
import { GeminiIcon } from "~/components/icons/GeminiIcon";
import type {
  ProviderId,
  StructuredOutputGroup,
  StructuredOutputGroupsData,
} from "~/types/structuredOutputGroups";
import groupsDataJson from "~/data/structured_output_groups.generated.json";
import { useAuth } from "~/lib/useAuth";

const groupsData = groupsDataJson as unknown as StructuredOutputGroupsData;

const DiffEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.DiffEditor),
  { ssr: false }
);

const DEFAULT_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "count": { "type": "integer" }
  },
  "required": ["name"]
}
`;

const GROUPS = groupsData.groups as StructuredOutputGroup[];

function ModelIcon({ provider }: { provider: ProviderId }) {
  const size = 18;
  const className = "model-btn-icon shrink-0";
  switch (provider) {
    case "openai":
      return <OpenAIIcon className={className} width={size} height={size} />;
    case "anthropic":
      return <ClaudeIcon className={className} width={size} height={size} />;
    case "gemini":
      return <GeminiIcon className={className} width={size} height={size} />;
    default:
      return null;
  }
}

function groupTooltip(group: StructuredOutputGroup): string {
  return [group.groupName, group.models.join(", ")].join("\n\n");
}

export default function Home() {
  useAuth();
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    () => GROUPS[0]?.groupId ?? null
  );
  const [results, setResults] = useState<ValidationResult[] | null>(null);
  const [loading] = useState(false);
  const [suggestedSchema, setSuggestedSchema] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedGroup = useMemo(
    () => GROUPS.find((g) => g.groupId === selectedGroupId) ?? null,
    [selectedGroupId]
  );

  const handleGroupChange = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
  }, []);

  const handleValidate = useCallback(async () => {
    setError("Not implemented");
  }, []);

  const handleFix = useCallback(async () => {
    setError("Not implemented");
  }, []);

  const handleAcceptSuggestion = useCallback(() => {
    if (suggestedSchema != null) {
      setSchema(suggestedSchema);
      setSuggestedSchema(null);
    }
  }, [suggestedSchema]);

  const handleRejectSuggestion = useCallback(() => {
    setSuggestedSchema(null);
  }, []);

  const normalizedDiffOriginal = useMemo(() => {
    if (suggestedSchema == null) return schema;
    try {
      return JSON.stringify(JSON.parse(schema), null, 2);
    } catch {
      return schema;
    }
  }, [schema, suggestedSchema]);

  const normalizedDiffModified = useMemo(() => {
    if (suggestedSchema == null) return null;
    try {
      return JSON.stringify(JSON.parse(suggestedSchema), null, 2);
    } catch {
      return suggestedSchema;
    }
  }, [suggestedSchema]);

  const applyLoadedJson = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      setSchema(JSON.stringify(parsed, null, 2));
    } catch {
      setSchema(trimmed);
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text === "string") applyLoadedJson(text);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [applyLoadedJson]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text === "string") applyLoadedJson(text);
      };
      reader.readAsText(file);
    },
    [applyLoadedJson]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  return (
    <div className="validator-page flex flex-col h-screen min-h-0">
      <SiteHeader subtitle current="validator" />

      <div className="model-bar">
        {GROUPS.map((g) => (
          <button
            key={g.groupId}
            type="button"
            title={groupTooltip(g)}
            className={`model-btn ${
              selectedGroupId === g.groupId ? "selected" : ""
            }`}
            onClick={() => handleGroupChange(g.groupId)}
          >
            <ModelIcon provider={g.providerId} />
            <span>{g.groupName}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <section className="editor-section">
          <div className="editor-header">
            <span className="editor-label">Schema Editor</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="upload-hint hover:text-accent hover:underline cursor-pointer"
            >
              Drop or upload file, paste or edit JSON
            </button>
          </div>
          <div
            className="editor-container"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            {suggestedSchema != null ? (
              <>
                <div className="flex-1 min-h-0 rounded-lg overflow-hidden flex flex-col border border-border bg-surface relative">
                  <DiffEditor
                    height="100%"
                    language="json"
                    original={normalizedDiffOriginal}
                    modified={normalizedDiffModified!}
                    theme="vs"
                    options={{
                      readOnly: true,
                      renderSideBySide: true,
                      enableSplitViewResizing: true,
                    }}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md bg-accent text-surface font-medium shadow hover:opacity-90"
                      onClick={handleAcceptSuggestion}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md bg-secondary text-primary font-medium shadow hover:opacity-90"
                      onClick={handleRejectSuggestion}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <SchemaEditor
                  value={schema}
                  onChange={setSchema}
                  selectedGroup={selectedGroup}
                  fillHeight
                  editorTheme="light"
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="validate-btn"
                    onClick={handleValidate}
                    disabled={loading}
                    title="Not implemented"
                  >
                    {loading ? "Validating…" : "Server Validation"}
                  </button>
                  <button
                    type="button"
                    className="validate-btn"
                    onClick={handleFix}
                    disabled={loading}
                    title="Not implemented"
                  >
                    Auto-fix
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="sidebar">
          {selectedGroup ? (
            <RightPane group={selectedGroup} />
          ) : (
            <div className="p-5 text-secondary text-sm">
              Choose a model group above.
            </div>
          )}
        </aside>
      </div>

      {error && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-error text-surface px-4 py-2 rounded-md shadow-lg text-sm z-50"
          role="alert"
        >
          {error}
        </div>
      )}

      {results && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="validator-page bg-surface rounded-lg shadow-xl max-h-[90vh] overflow-auto w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-primary">
                Validation results
              </h2>
              <button
                type="button"
                onClick={() => setResults(null)}
                className="text-secondary hover:text-primary"
              >
                Close
              </button>
            </div>
            <ValidationResults results={results} />
          </div>
        </div>
      )}
    </div>
  );
}
