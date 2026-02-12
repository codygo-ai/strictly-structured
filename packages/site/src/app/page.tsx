"use client";

import { useState, useCallback, useEffect } from "react";
import { SchemaEditor } from "~/components/SchemaEditor";
import { ModelSelector } from "~/components/ModelSelector";
import { ValidationResults } from "~/components/ValidationResults";
import type { ProviderId } from "~/lib/providers/types";
import type { ValidationResult } from "~/lib/providers/types";
import type { CompatibilityData } from "@ssv/schema-utils";
import { validateSchemaForModel } from "@ssv/schema-utils";
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

export default function Home() {
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [providers, setProviders] = useState<ProviderId[]>([
    "openai",
    "google",
    "anthropic",
  ]);
  const [results, setResults] = useState<ValidationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compatibilityData, setCompatibilityData] =
    useState<CompatibilityData | null>(null);
  const [compatibilityIssues, setCompatibilityIssues] = useState<
    Array<{ modelId: string; message: string; path: string }>
  >([]);

  useEffect(() => {
    fetch("/compatibility.json")
      .then((r) => r.json())
      .then(setCompatibilityData)
      .catch(() => setCompatibilityData({ version: 1, models: {}, schemas: {} }));
  }, []);

  const handleValidate = useCallback(async () => {
    setError(null);
    setResults(null);
    setCompatibilityIssues([]);
    const trimmed = schema.trim();
    if (!trimmed) {
      setError("Please enter a JSON schema.");
      return;
    }
    let parsed: object;
    try {
      parsed = JSON.parse(trimmed) as object;
    } catch {
      setError("Schema is not valid JSON.");
      return;
    }
    if (providers.length === 0) {
      setError("Select at least one provider.");
      return;
    }

    if (compatibilityData && Object.keys(compatibilityData.models).length > 0) {
      const issues: Array<{ modelId: string; message: string; path: string }> = [];
      for (const provider of providers) {
        const modelId = PROVIDER_TO_MODEL_ID[provider];
        const modelIssues = validateSchemaForModel(
          parsed,
          modelId,
          compatibilityData
        );
        for (const i of modelIssues) {
          issues.push({
            modelId,
            message: i.message,
            path: i.path,
          });
        }
      }
      setCompatibilityIssues(issues);
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
        body: JSON.stringify({ schema: trimmed, providers }),
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
  }, [schema, providers, compatibilityData]);

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
          Pick providers, paste or load a schema, then validate. We call each
          provider’s min-cost model to check your schema works.
        </p>
        <p className="text-sm text-zinc-500">
          Structured Schema Validator by Codygo · Open source
        </p>
      </section>

      <section className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-6">
        <ModelSelector selected={providers} onChange={setProviders} />
        <SchemaEditor
          value={schema}
          onChange={setSchema}
          onPaste={handlePaste}
          selectedModelIds={providers.map((p) => PROVIDER_TO_MODEL_ID[p])}
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
            providers.length === 0 ||
            !process.env.NEXT_PUBLIC_VALIDATE_API_URL
          }
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Validating…" : "Validate"}
        </button>
      </section>

      {compatibilityIssues.length > 0 && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <p className="font-medium">Model compatibility</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            {compatibilityIssues.map((i, idx) => (
              <li key={idx}>
                {i.message} {i.path && `(${i.path})`}
              </li>
            ))}
          </ul>
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
