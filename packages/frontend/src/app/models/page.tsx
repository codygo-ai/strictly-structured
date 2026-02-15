"use client";

import Link from "next/link";
import type { SchemaRuleSetsData } from "~/types/schemaRuleSets";
import ruleSetsDataJson from "~/data/schema_rule_sets.generated.json";
import { ComparisonTable } from "~/components/ComparisonTable";
import { RuleSetCard } from "~/components/RuleSetCard";
import { UniversalRules } from "~/components/UniversalRules";

const ruleSetsData = ruleSetsDataJson as unknown as SchemaRuleSetsData;

if (
  !ruleSetsData.meta?.comparisonColumns ||
  !Array.isArray(ruleSetsData.meta.comparisonColumns) ||
  ruleSetsData.meta.comparisonColumns.length === 0
) {
  throw new Error(
    "schema_rule_sets.json: meta.comparisonColumns is required and must be a non-empty array."
  );
}
if (
  !ruleSetsData.meta?.comparisonRows ||
  !Array.isArray(ruleSetsData.meta.comparisonRows) ||
  ruleSetsData.meta.comparisonRows.length === 0
) {
  throw new Error(
    "schema_rule_sets.json: meta.comparisonRows is required and must be a non-empty array."
  );
}
if (typeof ruleSetsData.meta?.sourcesDisplay !== "string") {
  throw new Error(
    "schema_rule_sets.json: meta.sourcesDisplay is required."
  );
}
if (
  !ruleSetsData.meta?.providerBadgeClasses ||
  typeof ruleSetsData.meta.providerBadgeClasses !== "object"
) {
  throw new Error(
    "schema_rule_sets.json: meta.providerBadgeClasses is required."
  );
}
if (
  !ruleSetsData.meta?.comparisonLegend ||
  typeof ruleSetsData.meta.comparisonLegend !== "object"
) {
  throw new Error(
    "schema_rule_sets.json: meta.comparisonLegend is required."
  );
}
if (
  !ruleSetsData.meta?.universal ||
  !Array.isArray(ruleSetsData.meta.universal.alwaysSupported) ||
  !Array.isArray(ruleSetsData.meta.universal.neverSupported)
) {
  throw new Error(
    "schema_rule_sets.json: meta.universal with alwaysSupported and neverSupported arrays is required."
  );
}

const RULE_SETS = ruleSetsData.ruleSets;
const META = ruleSetsData.meta;

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
        ruleSets={RULE_SETS}
      />
      </section>

      {RULE_SETS.map((ruleSet) => (
        <RuleSetCard key={ruleSet.ruleSetId} ruleSet={ruleSet} meta={META} />
      ))}

      <UniversalRules data={META.universal} />

      <div className="mt-6 text-[11px] text-muted text-center">
        Last verified: {META.lastUpdated} · Sources: {META.sourcesDisplay}
        official documentation
      </div>
    </div>
  );
}
