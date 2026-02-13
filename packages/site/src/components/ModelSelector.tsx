"use client";

import type { CompatibilityGroup } from "@ssv/schema-utils";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google: "Google",
  anthropic: "Anthropic",
};

function groupLabel(g: CompatibilityGroup): string {
  if (g.displayName) return g.displayName;
  const provider = PROVIDER_LABELS[g.provider] ?? g.provider;
  if (g.modelIds.length === 1) {
    return `${provider} (${g.representative.split(":")[1]})`;
  }
  return `${provider} (${g.modelIds.length} models, use ${g.representative.split(":")[1]})`;
}

interface ModelSelectorProps {
  groups: CompatibilityGroup[];
  selectedRepresentative: string | null;
  onChange: (representative: string) => void;
}

export function ModelSelector({
  groups,
  selectedRepresentative,
  onChange,
}: ModelSelectorProps) {
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {groups.map((g) => (
        <label
          key={g.id}
          className="flex items-center gap-2 cursor-pointer text-sm"
        >
          <input
            type="radio"
            name="model-group"
            checked={selectedRepresentative === g.representative}
            onChange={() => onChange(g.representative)}
            className="border-[var(--card-border)] bg-[var(--card)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span>{groupLabel(g)}</span>
        </label>
      ))}
    </div>
  );
}
