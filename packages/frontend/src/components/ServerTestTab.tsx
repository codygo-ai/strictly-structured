"use client";

import { useState, useCallback } from "react";
import type { SchemaRuleSet } from "~/types/schemaRuleSets";
import type { ValidationResult } from "~/lib/providers/types";
import { ValidationResults } from "~/components/ValidationResults";
import { useAuth } from "~/lib/useAuth";
import { useAudit, hashSchema } from "~/lib/audit";

interface ServerTestTabProps {
  schema: string;
  ruleSet: SchemaRuleSet;
}

export function ServerTestTab({ schema, ruleSet }: ServerTestTabProps) {
  const { ensureAuth } = useAuth();
  const { emit } = useAudit();
  const [results, setResults] = useState<ValidationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = useCallback(async () => {
    setError(null);
    setLoading(true);
    setResults(null);

    const hash = await hashSchema(schema);
    emit("server.validate.requested", {
      schemaHash: hash,
      schemaSizeBytes: new Blob([schema]).size,
      modelIds: ruleSet.models,
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
          modelIds: ruleSet.models,
        }),
      });
      const data = (await res.json()) as {
        results?: ValidationResult[];
        error?: string;
      };
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
  }, [ensureAuth, schema, ruleSet, emit]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-secondary mb-1">
          Test this schema against the real {ruleSet.provider} API
        </p>
        <p className="text-xs text-muted">
          Requires sign-in with Google
        </p>
      </div>

      <button
        type="button"
        className="primary-btn"
        onClick={handleTest}
        disabled={loading}
      >
        {loading ? "Testing\u2026" : "Run server test"}
      </button>

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {results && <ValidationResults results={results} />}
    </div>
  );
}
