"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { SiteHeader } from "~/components/SiteHeader";
import { SchemaEditor } from "~/components/SchemaEditor";
import { ValidationResults } from "~/components/ValidationResults";
import { OpenAIIcon } from "~/components/icons/OpenAIIcon";
import { ClaudeIcon } from "~/components/icons/ClaudeIcon";
import { GeminiIcon } from "~/components/icons/GeminiIcon";
import type { ValidationResult } from "~/lib/providers/types";
import type { CompatibilityData, CompatibilityGroup } from "@ssv/schema-utils";
import {
  getValidationIssuesForSelection,
  validateJsonSchema,
} from "@ssv/schema-utils";

const DEFAULT_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "count": { "type": "integer" }
  },
  "required": ["name"]
}
`;

function defaultGroupsFromLegacy(): Array<{
  id: string;
  provider: string;
  modelIds: string[];
  representative: string;
}> {
  const providers = ["openai", "google", "anthropic"] as const;
  const repMap: Record<string, string> = {
    openai: "openai:gpt-4.1-mini",
    google: "google:gemini-2.5-flash",
    anthropic: "anthropic:claude-3-5-haiku",
  };
  return providers.map((p) => ({
    id: repMap[p],
    provider: p,
    modelIds: [repMap[p]],
    representative: repMap[p],
  }));
}

function getSampleForGroup(
  representative: string,
  groups: CompatibilityGroup[]
): string {
  const g = groups.find(
    (x) =>
      x.representative === representative || x.modelIds.includes(representative)
  );
  return (g?.sampleSchema ?? DEFAULT_SCHEMA).trim();
}

function groupLabel(g: CompatibilityGroup): string {
  if (g.displayName) return g.displayName;
  const provider =
    { openai: "OpenAI", google: "Google", anthropic: "Anthropic" }[g.provider] ??
    g.provider;
  if (g.modelIds.length === 1) {
    return `${provider} (${g.representative.split(":")[1]})`;
  }
  return `${provider} (${g.modelIds.length} models)`;
}

const PRODUCT_NAMES: Record<string, string> = {
  openai: "GPT",
  google: "Gemini",
  anthropic: "Claude",
};

/** Button label: product name + version/differentiator (e.g. "GPT 4.1 / 5", "Claude 3.5 / 4.5", "Gemini 2.5 / 3"). */
function groupButtonLabel(g: CompatibilityGroup): string {
  const product = PRODUCT_NAMES[g.provider] ?? g.provider;
  if (g.displayName && g.displayName.includes(" (")) {
    const inParen = g.displayName.split(" (")[1]?.replace(/\)$/, "").trim();
    if (inParen) {
      let version = inParen;
      if (g.provider === "openai") {
        version = inParen.replace(/GPT-?/gi, "").replace(/\s*\/\s*/g, " / ").trim();
      } else if (g.provider === "anthropic") {
        version = inParen.replace(/^Claude\s+/i, "").trim() || inParen;
      } else if (g.provider === "google") {
        version = inParen.replace(/^Gemini\s+/i, "").trim() || inParen;
      }
      if (version) return `${product} ${version}`;
      return `${product} ${inParen}`;
    }
  }
  return product;
}

function ModelIcon({ provider }: { provider: string }) {
  const size = 18;
  const className = "model-btn-icon shrink-0";
  switch (provider) {
    case "openai":
      return <OpenAIIcon className={className} width={size} height={size} />;
    case "anthropic":
      return <ClaudeIcon className={className} width={size} height={size} />;
    case "google":
      return <GeminiIcon className={className} width={size} height={size} />;
    default:
      return null;
  }
}

/** Full details for tooltip and right panel. */
function groupTooltip(g: CompatibilityGroup): string {
  const parts: string[] = [];
  if (g.displayName) parts.push(g.displayName);
  if (g.note) parts.push(g.note);
  parts.push(g.modelIds.map((id) => id.split(":")[1]).join(", "));
  return parts.filter(Boolean).join("\n\n");
}

export default function Home() {
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [selectedRepresentative, setSelectedRepresentative] = useState<
    string | null
  >(null);
  const [results, setResults] = useState<ValidationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compatibilityData, setCompatibilityData] =
    useState<CompatibilityData | null>(null);
  const hasInitializedFromGroups = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => {
    if (compatibilityData?.groups && compatibilityData.groups.length > 0) {
      return compatibilityData.groups;
    }
    return defaultGroupsFromLegacy();
  }, [compatibilityData]);

  const selectedModelIds = useMemo(
    () => (selectedRepresentative ? [selectedRepresentative] : []),
    [selectedRepresentative]
  );

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (g) =>
          g.representative === selectedRepresentative ||
          g.modelIds.includes(selectedRepresentative ?? "")
      ),
    [groups, selectedRepresentative]
  );

  useEffect(() => {
    fetch("/compatibility.json")
      .then((r) => r.json())
      .then(setCompatibilityData)
      .catch(() =>
        setCompatibilityData({ version: 1, models: {}, schemas: {} })
      );
  }, []);

  useEffect(() => {
    if (
      compatibilityData == null ||
      groups.length === 0 ||
      hasInitializedFromGroups.current
    )
      return;
    hasInitializedFromGroups.current = true;
    const first = groups[0];
    if (first) {
      setSelectedRepresentative(first.representative);
      setSchema(
        (first as CompatibilityGroup).sampleSchema?.trim() ?? DEFAULT_SCHEMA
      );
    }
  }, [compatibilityData, groups]);

  const handleGroupChange = useCallback(
    (newRep: string) => {
      const prevRep = selectedRepresentative;
      const prevSample =
        prevRep && groups.length > 0 ? getSampleForGroup(prevRep, groups) : null;
      const currentTrimmed = schema.trim();
      if (prevSample != null && currentTrimmed === prevSample) {
        setSchema(getSampleForGroup(newRep, groups));
      }
      setSelectedRepresentative(newRep);
    },
    [selectedRepresentative, groups, schema]
  );

  const { schemaValidityErrors, selectionIssues } = useMemo(() => {
    const trimmed = schema.trim();
    const validityErrors: Array<{ path: string; message: string }> = [];
    const selection: Array<{
      path: string;
      keyword: string;
      message: string;
      suggestion?: string;
    }> = [];

    if (!trimmed)
      return { schemaValidityErrors: validityErrors, selectionIssues: selection };

    let parsed: object;
    try {
      parsed = JSON.parse(trimmed) as object;
    } catch {
      return { schemaValidityErrors: validityErrors, selectionIssues: selection };
    }

    const validity = validateJsonSchema(parsed);
    if (!validity.valid) {
      return {
        schemaValidityErrors: validity.errors,
        selectionIssues: selection,
      };
    }

    if (compatibilityData && selectedRepresentative) {
      selection.push(
        ...getValidationIssuesForSelection(
          parsed,
          [selectedRepresentative],
          compatibilityData
        )
      );
    }
    return {
      schemaValidityErrors: validity.errors,
      selectionIssues: selection,
    };
  }, [schema, selectedRepresentative, compatibilityData]);

  const isSchemaValid = useMemo(
    () => schema.trim() !== "" && schemaValidityErrors.length === 0,
    [schema, schemaValidityErrors.length]
  );

  const handleValidate = useCallback(async () => {
    setError(null);
    setResults(null);
    const trimmed = schema.trim();
    if (!trimmed) return;
    try {
      JSON.parse(trimmed);
    } catch {
      return;
    }
    if (!selectedRepresentative) return;

    const apiUrl =
      process.env.NEXT_PUBLIC_VALIDATE_API_URL?.replace(/\/$/, "") ?? "";
    if (!apiUrl) {
      setError("NEXT_PUBLIC_VALIDATE_API_URL is not set.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: trimmed, modelIds: selectedModelIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Validation request failed");
        return;
      }
      setResults(data.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [schema, selectedModelIds, selectedRepresentative]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setSchema(text);
    } catch {
      // ignore
    }
  }, []);

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

  const requirements = useMemo(() => {
    const list: { ok: boolean; warning: boolean; text: string }[] = [];
    const trimmed = schema.trim();
    let parsed: object | null = null;
    try {
      parsed = trimmed ? (JSON.parse(trimmed) as object) : null;
    } catch {
      list.push({ ok: false, warning: false, text: "Valid JSON structure" });
      return list;
    }
    list.push({ ok: true, warning: false, text: "Valid JSON structure" });
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      list.push({
        ok: true,
        warning: false,
        text: "Schema declaration present",
      });
    } else {
      list.push({
        ok: false,
        warning: true,
        text: "Schema declaration present",
      });
    }
    const hasNullable = trimmed.includes('"nullable"');
    const groupDisallowsNullable =
      selectedGroup?.keywordRules?.nullable?.allowed === false;
    if (hasNullable && groupDisallowsNullable) {
      list.push({
        ok: false,
        warning: true,
        text: "No nullable keyword (use anyOf)",
      });
    } else if (!hasNullable && groupDisallowsNullable) {
      list.push({
        ok: true,
        warning: false,
        text: "No nullable keyword (use anyOf)",
      });
    } else if (!hasNullable) {
      list.push({
        ok: true,
        warning: false,
        text: "No nullable keyword (use anyOf)",
      });
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      "additionalProperties" in parsed &&
      (parsed as Record<string, unknown>).additionalProperties === false
    ) {
      list.push({
        ok: true,
        warning: false,
        text: "additionalProperties: false set",
      });
    } else {
      list.push({
        ok: false,
        warning: true,
        text: "Missing additionalProperties: false",
      });
    }
    return list;
  }, [schema, selectedGroup]);

  return (
    <div className="validator-page flex flex-col min-h-screen">
      <SiteHeader subtitle current="validator" />

      <div className="model-bar">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            title={groupTooltip(g)}
            className={`model-btn ${
              selectedRepresentative === g.representative ? "selected" : ""
            }`}
            onClick={() => handleGroupChange(g.representative)}
          >
            <ModelIcon provider={g.provider} />
            <span>{groupButtonLabel(g)}</span>
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
              className="upload-hint hover:text-accent cursor-pointer"
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
            <SchemaEditor
              value={schema}
              onChange={setSchema}
              onPaste={handlePaste}
              selectedModelIds={selectedModelIds}
              compatibilityData={compatibilityData}
              fillHeight
              noHeader
              editorTheme="light"
            />
            <button
              type="button"
              className="validate-btn"
              onClick={handleValidate}
              disabled={
                loading ||
                !selectedRepresentative ||
                !isSchemaValid ||
                !process.env.NEXT_PUBLIC_VALIDATE_API_URL
              }
            >
              {loading ? "Validating…" : "Server Validation"}
            </button>
          </div>
        </section>

        <aside className="sidebar">
          <div className="model-info">
            <div className="model-name">
              {selectedGroup ? groupLabel(selectedGroup) : "Select a model"}
            </div>
            <div className="model-desc whitespace-pre-line">
              {selectedGroup
                ? (selectedGroup.note
                    ? selectedGroup.note + "\n\n" + selectedGroup.modelIds.map((id) => id.split(":")[1]).join(", ")
                    : selectedGroup.modelIds.map((id) => id.split(":")[1]).join(", "))
                : "Choose a model group above."}
            </div>
          </div>

          <div className="requirements-section">
            <div className="section-header">Requirements</div>
            {requirements.map((r, i) => (
              <div key={i} className="req-item">
                <span
                  className={`req-icon ${
                    r.ok ? "success" : r.warning ? "warning" : "error"
                  }`}
                >
                  {r.ok ? "✓" : r.warning ? "▲" : "✕"}
                </span>
                <span>{r.text}</span>
              </div>
            ))}

            <div className="section-header" style={{ marginTop: "1.5rem" }}>
              Issues & Auto-Fix
            </div>

            {schemaValidityErrors.length > 0 &&
              schemaValidityErrors.map((err, i) => (
                <div key={`valid-${i}`} className="issue-card">
                  <div className="issue-header">
                    <span className="issue-icon error">✕</span>
                    <span>
                      {err.path ? `${err.path}: ` : ""}Invalid schema
                    </span>
                  </div>
                  <div className="issue-body">{err.message}</div>
                </div>
              ))}

            {selectionIssues.map((issue, i) => (
              <div key={`sel-${i}`} className="issue-card">
                <div className="issue-header">
                  <span
                    className={
                      issue.severity === "error"
                        ? "issue-icon error"
                        : "issue-icon warning"
                    }
                  >
                    {issue.severity === "error" ? "✕" : "▲"}
                  </span>
                  <span>
                    {issue.path
                      ? `Unsupported: ${issue.keyword}`
                      : issue.keyword}
                  </span>
                </div>
                <div className="issue-body">{issue.message}</div>
                {issue.suggestion && (
                  <div
                    className="issue-fix"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      // Could implement apply fix in future
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        e.preventDefault();
                    }}
                  >
                    {issue.suggestion}
                  </div>
                )}
              </div>
            ))}

            {schemaValidityErrors.length === 0 &&
              selectionIssues.length === 0 &&
              schema.trim() !== "" && (
                <p className="text-sm text-secondary py-2">
                  No issues. Schema is valid for the selected model group.
                </p>
              )}
          </div>
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
