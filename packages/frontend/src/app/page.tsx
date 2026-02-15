"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
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
import { useAudit, hashSchema } from "~/lib/audit";
import { fixSchemaForGroup, type FixResult } from "~/lib/schemaFixer";

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
  const { resolvedTheme } = useTheme();
  const { ensureAuth } = useAuth();
  const { emit } = useAudit();
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    () => GROUPS[0]?.groupId ?? null
  );
  const [results, setResults] = useState<ValidationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestedSchema, setSuggestedSchema] = useState<string | null>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedGroup = useMemo(
    () => GROUPS.find((g) => g.groupId === selectedGroupId) ?? null,
    [selectedGroupId]
  );

  const handleGroupChange = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
    const group = GROUPS.find((g) => g.groupId === groupId);
    if (group) {
      emit("group.selected", { groupId, providerId: group.providerId });
    }
  }, [emit]);

  const handleValidate = useCallback(async () => {
    setError(null);
    setLoading(true);
    const hash = await hashSchema(schema);
    emit("server.validate.requested", {
      schemaHash: hash,
      schemaSizeBytes: new Blob([schema]).size,
      modelIds: selectedGroup?.models ?? [],
    });
    try {
      const token = await ensureAuth();
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schema,
          modelIds: selectedGroup?.models,
        }),
      });
      const data = (await res.json()) as { results?: ValidationResult[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      if (data.results) setResults(data.results);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [ensureAuth, schema, selectedGroup, emit]);

  const handleFix = useCallback(async () => {
    setError(null);
    setFixResult(null);

    if (!selectedGroup) return;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(schema) as Record<string, unknown>;
    } catch {
      setError("Schema is not valid JSON");
      return;
    }

    const result = fixSchemaForGroup(parsed, selectedGroup);

    if (result.appliedFixes.length === 0 && result.unresolvedErrors.length === 0) {
      setError("No issues found — schema is already compliant");
      return;
    }

    setFixResult(result);
    if (result.appliedFixes.length > 0) {
      setSuggestedSchema(JSON.stringify(result.fixedSchema, null, 2));
    }

    const hash = await hashSchema(schema);
    emit("fix.requested", {
      schemaHash: hash,
      issueCount: result.appliedFixes.length + result.unresolvedErrors.length,
    });
  }, [schema, selectedGroup, emit]);

  const handleAcceptSuggestion = useCallback(async () => {
    if (suggestedSchema != null) {
      const hash = await hashSchema(schema);
      const suggestedHash = await hashSchema(suggestedSchema);
      emit("fix.accepted", { schemaHash: hash, suggestedSchemaHash: suggestedHash });
      setSchema(suggestedSchema);
      setSuggestedSchema(null);
      setFixResult(null);
    }
  }, [suggestedSchema, schema, emit]);

  const handleRejectSuggestion = useCallback(async () => {
    const hash = await hashSchema(schema);
    emit("fix.rejected", { schemaHash: hash });
    setSuggestedSchema(null);
    setFixResult(null);
  }, [schema, emit]);

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
        if (typeof text === "string") {
          emit("schema.loaded", { method: "file_upload", schemaSizeBytes: new Blob([text]).size });
          applyLoadedJson(text);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [applyLoadedJson, emit]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text === "string") {
          emit("schema.loaded", { method: "drag_drop", schemaSizeBytes: new Blob([text]).size });
          applyLoadedJson(text);
        }
      };
      reader.readAsText(file);
    },
    [applyLoadedJson, emit]
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
                    theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
                    options={{
                      readOnly: true,
                      renderSideBySide: true,
                      enableSplitViewResizing: true,
                      fixedOverflowWidgets: true,
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
                {fixResult && (
                  <div className="fix-summary mt-2 text-sm space-y-1 max-h-40 overflow-auto">
                    {fixResult.appliedFixes.map((fix, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className={fix.infoLost ? "text-yellow-600" : "text-green-600"}>
                          {fix.infoLost ? "~" : "+"}
                        </span>
                        <span className="text-primary">{fix.description}</span>
                        {fix.infoLost && (
                          <span className="text-secondary italic ml-1">— {fix.infoLost}</span>
                        )}
                      </div>
                    ))}
                    {fixResult.unresolvedErrors.map((err, i) => (
                      <div key={`u${i}`} className="flex gap-2 items-start">
                        <span className="text-red-600">!</span>
                        <span className="text-primary">{err.message}</span>
                        <span className="text-secondary italic ml-1">— {err.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <SchemaEditor
                  value={schema}
                  onChange={setSchema}
                  selectedGroup={selectedGroup}
                  fillHeight
                  onAuditEvent={emit}
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="validate-btn"
                    onClick={handleValidate}
                    disabled={loading}
                  >
                    {loading ? "Validating…" : "Server Validation"}
                  </button>
                  <button
                    type="button"
                    className="validate-btn"
                    onClick={handleFix}
                    disabled={loading}
                  >
                    Auto-fix
                  </button>
                </div>
                {fixResult && fixResult.appliedFixes.length === 0 && fixResult.unresolvedErrors.length > 0 && (
                  <div className="fix-summary mt-2 text-sm space-y-1 max-h-40 overflow-auto">
                    {fixResult.unresolvedErrors.map((err, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-red-600">!</span>
                        <span className="text-primary">{err.message}</span>
                        <span className="text-secondary italic ml-1">— {err.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
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
