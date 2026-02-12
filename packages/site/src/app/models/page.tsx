"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CompatibilityData } from "@ssv/schema-utils";

export default function ModelSupportPage() {
  const [data, setData] = useState<CompatibilityData | null>(null);

  useEffect(() => {
    fetch("/api/compatibility")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ version: 1, models: {}, schemas: {} }));
  }, []);

  if (!data) {
    return (
      <div className="py-8 text-zinc-400">
        Loading model support data…
      </div>
    );
  }

  const modelIds = Object.keys(data.models);
  if (modelIds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Model support</h1>
        <p className="text-zinc-400">
          No compatibility data yet. Run the compatibility runner to generate
          per-model supported JSON Schema features:{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm">
            pnpm --filter @ssv/compatibility-runner run
          </code>
        </p>
        <Link
          href="/"
          className="text-[var(--accent)] hover:underline"
        >
          Back to validator
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Model support
        </h1>
        <p className="mt-2 text-zinc-400">
          JSON Schema features that each model accepted in our compatibility
          runs. Use this to choose schemas that work with your selected
          providers.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
        >
          Back to validator
        </Link>
      </div>

      <div className="space-y-8">
        {modelIds.map((modelId) => {
          const model = data.models[modelId];
          const supported = model.supported_keywords ?? [];
          return (
            <section
              key={modelId}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6"
            >
              <h2 className="text-lg font-semibold text-white font-mono">
                {modelId}
              </h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">
                    Supported ({supported.length})
                  </h3>
                  <p className="text-sm text-zinc-300">
                    {supported.length > 0
                      ? supported.join(", ")
                      : "None recorded"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">
                    Passing schemas
                  </h3>
                  <p className="text-sm text-zinc-300">
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
