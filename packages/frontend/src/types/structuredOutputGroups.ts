/**
 * Types for structured_output_groups.json (verbatim shape).
 * UI reads from these keys; no transformation of the JSON structure.
 */

export interface HardConstraint {
  rule: string;
  detail: string;
  severity: "error" | "warning" | "info";
}

export interface SupportedType {
  type: string;
  supported_keywords: string[];
  notes?: string;
}

export interface GroupDisplay {
  hard_constraints: HardConstraint[];
  supported_types: SupportedType[];
  string_formats?: string[];
  composition?: { supported: string[]; unsupported: string[]; notes?: string };
  unsupported_keywords: Record<string, string[]>;
  quantitative_limits: Record<string, number | string | null | undefined>;
  nullable_mechanism?: string;
  recursive_schemas?: boolean;
  behaviors: Record<string, string | boolean>;
  best_practices: string[];
}

export type ProviderId = "openai" | "anthropic" | "gemini";

export interface ComparisonColumn {
  id: ProviderId;
}

export interface StructuredOutputGroup {
  group_id: string;
  group_name: string;
  provider: string;
  provider_id: ProviderId;
  short_name: string;
  doc_url: string;
  description: string;
  models: string[];
  model_notes?: string;
  api_parameter?: Record<string, unknown>;
  display: GroupDisplay;
  machine?: Record<string, unknown>;
}

export interface ComparisonRow {
  feature: string;
  openai: string;
  anthropic: string;
  gemini: string;
  openaiOk: boolean | "warn" | "partial";
  anthropicOk: boolean | "partial";
  geminiOk: boolean | "partial";
}

export interface UniversalRules {
  alwaysSupported: string[];
  neverSupported: string[];
}

export interface ComparisonLegend {
  supported: string;
  unsupported: string;
  limited: string;
  not_on_finetuned: string;
}

export interface StructuredOutputGroupsMeta {
  version: string;
  last_updated: string;
  description: string;
  sources: Record<string, string>;
  comparison_columns: ComparisonColumn[];
  comparison_rows: ComparisonRow[];
  sources_display: string;
  provider_badge_classes: Record<ProviderId, string>;
  comparison_legend: ComparisonLegend;
  universal: UniversalRules;
}

export interface StructuredOutputGroupsData {
  meta: StructuredOutputGroupsMeta;
  groups: StructuredOutputGroup[];
}
