"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { SchemaEditor } from "~/components/SchemaEditor";
import { ModelSelector } from "~/components/ModelSelector";
import { ValidationResults } from "~/components/ValidationResults";
import type { ValidationResult } from "~/lib/providers/types";
import type { CompatibilityData, CompatibilityGroup } from "@ssv/schema-utils";
import {
  getValidationIssuesForSelection,
  validateJsonSchema,
} from "@ssv/schema-utils";
import { PROVIDER_TO_MODEL_ID } from "~/lib/modelIds";

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
  return providers.map((p) => {
    const rep = PROVIDER_TO_MODEL_ID[p];
    return {
      id: rep,
      provider: p,
      modelIds: [rep],
      representative: rep,
    };
  });
}

function getSampleForGroup(
  representative: string,
  groups: CompatibilityGroup[]
): string {
  const g = groups.find(
    (x) => x.representative === representative || x.modelIds.includes(representative)
  );
  return (g?.sampleSchema ?? DEFAULT_SCHEMA).trim();
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

  useEffect(() => {
    fetch("/compatibility.json")
      .then((r) => r.json())
      .then(setCompatibilityData)
      .catch(() =>
        setCompatibilityData({ version: 1, models: {}, schemas: {} })
      );
  }, []);

  // Once we have compatibility data and groups: select first group and set schema to its sample (or default).
  useEffect(() => {
    if (compatibilityData == null || groups.length === 0 || hasInitializedFromGroups.current)
      return;
    hasInitializedFromGroups.current = true;
    const first = groups[0];
    if (first) {
      setSelectedRepresentative(first.representative);
      setSchema((first as CompatibilityGroup).sampleSchema?.trim() ?? DEFAULT_SCHEMA);
    }
  }, [compatibilityData, groups]);

  const handleGroupChange = useCallback(
    (newRep: string) => {
      const prevRep = selectedRepresentative;
      const prevSample =
        prevRep && groups.length > 0 ? getSampleForGroup(prevRep, groups) : null;
      const currentTrimmed = schema.trim();
      if (
        prevSample != null &&
        currentTrimmed === prevSample
      ) {
        setSchema(getSampleForGroup(newRep, groups));
      }
      setSelectedRepresentative(newRep);
    },
    [selectedRepresentative, groups, schema]
  );

  const { schemaValidityErrors, selectionIssues } = useMemo(() => {
    const trimmed = schema.trim();
    const validityErrors: Array<{ path: string; message: string }> = [];
    const selection: Array<{ path: string; keyword: string; message: string }> = [];

    if (!trimmed) return { schemaValidityErrors: validityErrors, selectionIssues: selection };

    let parsed: object;
    try {
      parsed = JSON.parse(trimmed) as object;
    } catch {
      return { schemaValidityErrors: validityErrors, selectionIssues: selection };
    }

    const validity = validateJsonSchema(parsed);
    if (!validity.valid) {
      return { schemaValidityErrors: validity.errors, selectionIssues: selection };
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
    return { schemaValidityErrors: validity.errors, selectionIssues: selection };
  }, [schema, selectedRepresentative, compatibilityData]);

  const handleValidate = useCallback(async () => {
    setError(null);
    setResults(null);
    const trimmed = schema.trim();
    if (!trimmed) {
      setError("Please enter a JSON schema.");
      return;
    }
    try {
      JSON.parse(trimmed);
    } catch {
      setError("Schema is not valid JSON.");
      return;
    }
    if (!selectedRepresentative) {
      setError("Select a model group.");
      return;
    }

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
  }, [schema, selectedRepresentative, compatibilityData]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setSchema(text);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-8">
      <section className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Validate JSON schemas for LLM structured outputs
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Select a model group, paste or load a schema, then validate.
        </p>
        <p className="text-sm text-zinc-500">
          Structured Schema Validator by Codygo · Open source
        </p>
      </section>

      <section className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-6">
        <ModelSelector
          groups={groups}
          selectedRepresentative={selectedRepresentative}
          onChange={handleGroupChange}
        />
        <SchemaEditor
          value={schema}
          onChange={setSchema}
          onPaste={handlePaste}
          selectedModelIds={selectedModelIds}
          compatibilityData={compatibilityData}
        />
        {error && (
          <p className="text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleValidate}
          disabled={
            loading ||
            !selectedRepresentative ||
            !process.env.NEXT_PUBLIC_VALIDATE_API_URL
          }
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Validating…" : "Validate"}
        </button>
      </section>

      {(schemaValidityErrors.length > 0 || selectionIssues.length > 0) && (
        <div className="space-y-4">
          {schemaValidityErrors.length > 0 && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <p className="font-medium">Invalid JSON Schema</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {schemaValidityErrors.map((i, idx) => (
                  <li key={idx}>
                    {i.path ? `${i.path}: ` : ""}
                    {i.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectionIssues.length > 0 && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <p className="font-medium">Not supported for your selection</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {selectionIssues.map((i, idx) => (
                  <li key={idx}>
                    {i.keyword}
                    {i.path && ` (${i.path})`}: {i.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {results && (
        <section>
          <ValidationResults results={results} />
        </section>
      )}
    </div>
  );
}
