"use client";

import type { ValidationResult } from "~/lib/providers/types";

interface ValidationResultsProps {
  results: ValidationResult[] | null;
}

export function ValidationResults({ results }: ValidationResultsProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-primary">Results</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <div
            key={r.provider}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium capitalize text-primary">
                {r.provider}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  r.ok
                    ? "bg-success/20 text-success"
                    : "bg-error/20 text-error"
                }`}
              >
                {r.ok ? "OK" : "Failed"}
              </span>
            </div>
            <p className="mt-1 text-xs text-secondary">{r.model}</p>
            {r.latencyMs > 0 && (
              <p className="mt-0.5 text-xs text-muted">
                {r.latencyMs} ms
              </p>
            )}
            {!r.ok && r.error && (
              <p className="mt-2 text-sm text-error wrap-break-word">
                {r.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
