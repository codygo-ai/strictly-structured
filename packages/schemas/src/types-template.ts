/**
 * Generated from @ssv/schemas. Do not edit by hand.
 * Types for structured_output_groups (camelCase shape).
 */

export interface HardConstraint {
  rule: string;
  detail: string;
  severity: "error" | "warning" | "info";
}

export interface SupportedType {
  type: string;
  supportedKeywords: string[];
  notes?: string;
}

export interface GroupDisplay {
  hardConstraints: HardConstraint[];
  supportedTypes: SupportedType[];
  stringFormats?: string[];
  composition?: { supported: string[]; unsupported: string[]; notes?: string };
  unsupportedKeywords: Record<string, string[]>;
  quantitativeLimits: Record<string, number | string | null | undefined>;
  nullableMechanism?: string;
  recursiveSchemas?: boolean;
  behaviors: Record<string, string | boolean>;
  bestPractices: string[];
}

export type ProviderId = "openai" | "anthropic" | "gemini";

export interface ComparisonColumn {
  id: ProviderId;
}

export interface StructuredOutputGroup {
  groupId: string;
  groupName: string;
  provider: string;
  providerId: ProviderId;
  docUrl: string;
  description: string;
  models: string[];
  modelNotes?: string;
  apiParameter?: Record<string, unknown>;
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
  notOnFinetuned: string;
}

export interface StructuredOutputGroupsMeta {
  version: string;
  lastUpdated: string;
  description: string;
  sources: Record<string, string>;
  comparisonColumns: ComparisonColumn[];
  comparisonRows: ComparisonRow[];
  sourcesDisplay: string;
  providerBadgeClasses: Record<ProviderId, string>;
  comparisonLegend: ComparisonLegend;
  universal: UniversalRules;
}

export interface StructuredOutputGroupsData {
  meta: StructuredOutputGroupsMeta;
  groups: StructuredOutputGroup[];
}
