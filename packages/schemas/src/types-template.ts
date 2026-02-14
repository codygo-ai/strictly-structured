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
  unsupportedKeywords?: string[];
  notes?: string;
}

export interface GroupLimits {
  maxProperties: number | null;
  maxNestingDepth: number | null;
  maxStringLengthNamesEnums?: number | null;
  maxEnumValues?: number | null;
  maxEnumStringLengthOver250Values?: number | null;
  recursiveDepth?: string | null;
  notes?: string | null;
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

  supportedTypes: SupportedType[];
  stringFormats?: string[];
  composition?: { supported: string[]; unsupported: string[]; notes?: string };
  limits: GroupLimits;

  rootType: string | string[];
  rootAnyOfAllowed: boolean;
  allFieldsRequired: boolean;
  additionalPropertiesMustBeFalse: boolean;
  additionalPropertiesFalseRecommended?: boolean;
  recursiveSchemas?: boolean;
  recursiveDepthLimited?: boolean;
  nullableViaTypeArray?: boolean;
  finetunedAdditionallyUnsupported?: string[];
  validationRules?: Array<{
    path: string;
    check: string;
    value?: unknown;
    keywords?: string[];
  }>;

  hardConstraints: HardConstraint[];
  nullableMechanism?: string;
  behaviors: Record<string, string | boolean>;
  bestPractices: string[];
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
