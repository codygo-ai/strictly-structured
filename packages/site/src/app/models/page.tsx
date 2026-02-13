"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CompatibilityData } from "@ssv/schema-utils";

export default function ModelSupportPage() {
  const [data, setData] = useState<CompatibilityData | null>(null);

  useEffect(() => {
    fetch("/compatibility.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ version: 1, models: {}, schemas: {} }));
  }, []);

  if (!data) {
    return (
      <div className="py-8 text-secondary">
        Loading model support data…
      </div>
    );
  }

  const modelIds = Object.keys(data.models);
  if (modelIds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-primary">Model support</h1>
        <p className="text-secondary">
          No compatibility data yet. Run the compatibility runner to generate
          per-model supported JSON Schema features:{" "}
          <code className="rounded bg-code-bg px-1.5 py-0.5 text-sm text-accent">
            pnpm --filter @ssv/compatibility-runner run
          </code>
        </p>
        <Link
          href="/"
          className="text-accent hover:underline"
        >
          Back to validator
        </Link>
      </div>
    );
  }

  const groups = data.groups ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary tracking-tight">
          Model support
        </h1>
        <p className="mt-2 text-secondary">
          JSON Schema features that each model accepted in our compatibility
          runs. Models with identical support are grouped; the validator uses
          the minimal-cost model in each group at runtime.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          Back to validator
        </Link>
      </div>

      {groups.length > 0 && (
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-primary mb-4 section-header">
            Validation groups (used in validator)
          </h2>
          <ul className="space-y-3 text-sm text-secondary">
            {groups.map((g) => (
              <li key={g.id}>
                <span className="font-medium text-primary capitalize">
                  {g.provider}
                </span>
                : {g.modelIds.join(", ")} → use{" "}
                <code className="rounded bg-code-bg px-1 text-accent">{g.representative}</code>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="space-y-8">
        {modelIds.map((modelId) => {
          const model = data.models[modelId];
          const supported = model.supported_keywords ?? [];
          return (
            <section
              key={modelId}
              className="rounded-lg border border-border bg-surface p-6"
            >
              <h2 className="text-lg font-semibold text-primary font-mono">
                {modelId}
              </h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted mb-2">
                    Supported ({supported.length})
                  </h3>
                  <p className="text-sm text-secondary">
                    {supported.length > 0
                      ? supported.join(", ")
                      : "None recorded"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted mb-2">
                    Passing schemas
                  </h3>
                  <p className="text-sm text-secondary">
                    {model.supported?.length ?? 0} of{" "}
                    {Object.keys(data.schemas).length} corpus schemas
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
