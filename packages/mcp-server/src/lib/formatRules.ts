import type { SchemaRuleSet } from "@ssv/schemas/types";
import type { SchemaMarker } from "@ssv/schemas/ruleSetValidator";

export function formatRuleSetAsText(ruleSet: SchemaRuleSet): string {
  const sections: string[] = [];

  sections.push(`# ${ruleSet.provider} (${ruleSet.displayName}) Structured Output Rules`);
  sections.push(`Documentation: ${ruleSet.docUrl}`);

  const rootTypes = Array.isArray(ruleSet.rootType) ? ruleSet.rootType.join(" | ") : ruleSet.rootType;
  sections.push([
    "## Root Constraints",
    `- Root type: ${rootTypes}`,
    `- Root-level anyOf: ${ruleSet.rootAnyOfAllowed ? "allowed" : "NOT allowed"}`,
    `- All properties MUST be in "required": ${ruleSet.allFieldsRequired ? "YES" : "NO"}`,
    `- "additionalProperties" MUST be false: ${ruleSet.additionalPropertiesMustBeFalse ? "YES" : ruleSet.additionalPropertiesFalseRecommended ? "RECOMMENDED" : "NO"}`,
  ].join("\n"));

  const typeLines = ruleSet.supportedTypes.map((st) => {
    const parts = [`- ${st.type}: ${st.supportedKeywords.join(", ") || "(no keywords)"}`];
    if (st.unsupportedKeywords?.length) {
      parts.push(`  NOT supported: ${st.unsupportedKeywords.join(", ")}`);
    }
    if (st.notes) {
      parts.push(`  Notes: ${st.notes}`);
    }
    return parts.join("\n");
  });
  sections.push(["## Supported Types & Keywords", ...typeLines].join("\n"));

  if (ruleSet.stringFormats?.length) {
    sections.push(`## String Formats\nSupported: ${ruleSet.stringFormats.join(", ")}`);
  } else {
    sections.push("## String Formats\nNone supported");
  }

  if (ruleSet.composition) {
    const compLines = [
      "## Composition",
      `Supported: ${ruleSet.composition.supported.join(", ")}`,
      `NOT supported: ${ruleSet.composition.unsupported.join(", ")}`,
    ];
    if (ruleSet.composition.notes) {
      compLines.push(`Notes: ${ruleSet.composition.notes}`);
    }
    sections.push(compLines.join("\n"));
  }

  const limitLines = ["## Size Limits"];
  limitLines.push(ruleSet.sizeLimits.maxProperties !== null
    ? `- Max properties: ${ruleSet.sizeLimits.maxProperties}`
    : "- Max properties: no limit");
  limitLines.push(ruleSet.sizeLimits.maxNestingDepth !== null
    ? `- Max nesting depth: ${ruleSet.sizeLimits.maxNestingDepth}`
    : "- Max nesting depth: no limit");
  if (ruleSet.sizeLimits.maxStringLengthNamesEnums !== undefined && ruleSet.sizeLimits.maxStringLengthNamesEnums !== null) {
    limitLines.push(`- Max string length (names + enums): ${ruleSet.sizeLimits.maxStringLengthNamesEnums}`);
  }
  if (ruleSet.sizeLimits.maxEnumValues !== undefined && ruleSet.sizeLimits.maxEnumValues !== null) {
    limitLines.push(`- Max enum values: ${ruleSet.sizeLimits.maxEnumValues}`);
  }
  sections.push(limitLines.join("\n"));

  const reqLines = ruleSet.requirements.map((r) => `- [${r.severity}] ${r.rule}: ${r.detail}`);
  sections.push(["## Requirements", ...reqLines].join("\n"));

  const tipLines = ruleSet.tips.map((t) => `- ${t}`);
  sections.push(["## Tips", ...tipLines].join("\n"));

  return sections.join("\n\n");
}

export function formatMarkersAsText(markers: SchemaMarker[]): string {
  if (markers.length === 0) return "No validation issues found.";

  return markers
    .map((m, i) => `${i + 1}. [${m.severity}] Line ${m.startLineNumber}:${m.startColumn} — ${m.message}`)
    .join("\n");
}
