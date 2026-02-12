"use client";

import type { ProviderId } from "~/lib/providers/types";

const LABELS: Record<ProviderId, string> = {
  openai: "OpenAI (GPT-4o mini)",
  google: "Google (Gemini 2.0 Flash)",
  anthropic: "Anthropic (Claude 3.5 Haiku)",
};

interface ModelSelectorProps {
  selected: ProviderId[];
  onChange: (ids: ProviderId[]) => void;
}

export function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  const toggle = (id: ProviderId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      {(["openai", "google", "anthropic"] as const).map((id) => (
        <label
          key={id}
          className="flex items-center gap-2 cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            checked={selected.includes(id)}
            onChange={() => toggle(id)}
            className="rounded border-[var(--card-border)] bg-[var(--card)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span>{LABELS[id]}</span>
        </label>
      ))}
    </div>
  );
}
