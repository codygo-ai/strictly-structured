"use client";

import Link from "next/link";
import type { StructuredOutputGroupsData } from "~/types/structuredOutputGroups";
import groupsDataJson from "~/data/structured_output_groups.generated.json";
import { ComparisonTable } from "~/components/ComparisonTable";
import { GroupCard } from "~/components/GroupCard";
import { UniversalRules } from "~/components/UniversalRules";

const groupsData = groupsDataJson as unknown as StructuredOutputGroupsData;

if (
  !groupsData.meta?.comparisonColumns ||
  !Array.isArray(groupsData.meta.comparisonColumns) ||
  groupsData.meta.comparisonColumns.length === 0
) {
  throw new Error(
    "structured_output_groups.json: meta.comparisonColumns is required and must be a non-empty array."
  );
}
if (
  !groupsData.meta?.comparisonRows ||
  !Array.isArray(groupsData.meta.comparisonRows) ||
  groupsData.meta.comparisonRows.length === 0
) {
  throw new Error(
    "structured_output_groups.json: meta.comparisonRows is required and must be a non-empty array."
  );
}
if (typeof groupsData.meta?.sourcesDisplay !== "string") {
  throw new Error(
    "structured_output_groups.json: meta.sourcesDisplay is required."
  );
}
if (
  !groupsData.meta?.providerBadgeClasses ||
  typeof groupsData.meta.providerBadgeClasses !== "object"
) {
  throw new Error(
    "structured_output_groups.json: meta.providerBadgeClasses is required."
  );
}
if (
  !groupsData.meta?.comparisonLegend ||
  typeof groupsData.meta.comparisonLegend !== "object"
) {
  throw new Error(
    "structured_output_groups.json: meta.comparisonLegend is required."
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
        columns={META.comparisonColumns}
        rows={META.comparisonRows}
        legend={META.comparisonLegend}
        groups={GROUPS}
      />
      </section>

      {GROUPS.map((group) => (
        <GroupCard key={group.groupId} group={group} meta={META} />
      ))}

      <UniversalRules data={META.universal} />

      <div className="mt-6 text-[11px] text-[#bbb] text-center">
        Last verified: {META.lastUpdated} · Sources: {META.sourcesDisplay}
        official documentation
      </div>
    </div>
  );
}
