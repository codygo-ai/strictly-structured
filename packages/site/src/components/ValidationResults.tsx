"use client";

import type { ValidationResult } from "~/lib/providers/types";

interface ValidationResultsProps {
  results: ValidationResult[] | null;
}

export function ValidationResults({ results }: ValidationResultsProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Results</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <div
            key={r.provider}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium capitalize text-white">
                {r.provider}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  r.ok
                    ? "bg-[var(--success)]/20 text-[var(--success)]"
                    : "bg-[var(--error)]/20 text-[var(--error)]"
                }`}
              >
                {r.ok ? "OK" : "Failed"}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{r.model}</p>
            {r.latencyMs > 0 && (
              <p className="mt-0.5 text-xs text-zinc-500">
                {r.latencyMs} ms
              </p>
            )}
            {!r.ok && r.error && (
              <p className="mt-2 text-sm text-[var(--error)] break-words">
                {r.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
