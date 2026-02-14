"use client";

import Link from "next/link";
import type { StructuredOutputGroupsData } from "~/types/structuredOutputGroups";
import groupsDataJson from "~/data/structured_output_groups.json";
import { ComparisonTable } from "~/components/ComparisonTable";
import { GroupCard } from "~/components/GroupCard";
import { UniversalRules } from "~/components/UniversalRules";

const groupsData = groupsDataJson as unknown as StructuredOutputGroupsData;

if (
  !groupsData.meta?.comparison_columns ||
  !Array.isArray(groupsData.meta.comparison_columns) ||
  groupsData.meta.comparison_columns.length === 0
) {
  throw new Error(
    "structured_output_groups.json: meta.comparison_columns is required and must be a non-empty array."
  );
}
if (
  !groupsData.meta?.comparison_rows ||
  !Array.isArray(groupsData.meta.comparison_rows) ||
  groupsData.meta.comparison_rows.length === 0
) {
  throw new Error(
    "structured_output_groups.json: meta.comparison_rows is required and must be a non-empty array."
  );
}
if (typeof groupsData.meta?.sources_display !== "string") {
  throw new Error(
    "structured_output_groups.json: meta.sources_display is required."
  );
}
if (
  !groupsData.meta?.provider_badge_classes ||
  typeof groupsData.meta.provider_badge_classes !== "object"
) {
  throw new Error(
    "structured_output_groups.json: meta.provider_badge_classes is required."
  );
}
if (
  !groupsData.meta?.comparison_legend ||
  typeof groupsData.meta.comparison_legend !== "object"
) {
  throw new Error(
    "structured_output_groups.json: meta.comparison_legend is required."
  );
}
if (
  !groupsData.meta?.universal ||
  !Array.isArray(groupsData.meta.universal.alwaysSupported) ||
  !Array.isArray(groupsData.meta.universal.neverSupported)
) {
  throw new Error(
    "structured_output_groups.json: meta.universal with alwaysSupported and neverSupported arrays is required."
  );
}

const GROUPS = groupsData.groups;
const META = groupsData.meta;

export default function ModelSupportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary tracking-tight">
          Model Support
        </h1>
        <p className="mt-2 text-secondary leading-snug">
          JSON Schema support across LLM structured output providers. Each
          group shares identical schema semantics — models within a group
          differ only in performance and pricing.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          Back to validator
        </Link>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-[15px] font-bold text-primary mb-4">
          Quick Comparison
        </h2>
        <ComparisonTable
        columns={META.comparison_columns}
        rows={META.comparison_rows}
        legend={META.comparison_legend}
        groups={GROUPS}
      />
      </section>

      {GROUPS.map((group) => (
        <GroupCard key={group.group_id} group={group} meta={META} />
      ))}

      <UniversalRules data={META.universal} />

      <div className="mt-6 text-[11px] text-[#bbb] text-center">
        Last verified: {META.last_updated} · Sources: {META.sources_display}
        official documentation
      </div>
    </div>
  );
}
