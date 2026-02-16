/**
 * Generated from @ssv/schemas. Do not edit by hand.
 * Types for schema_rule_sets (camelCase shape).
 */

export interface Requirement {
  rule: string;
  detail: string;
  severity: 'error' | 'warning' | 'info';
}

export interface SupportedType {
  type: string;
  supportedKeywords: string[];
  unsupportedKeywords?: string[];
  notes?: string;
}

export interface SizeLimits {
  maxProperties: number | null;
  maxNestingDepth: number | null;
  maxStringLengthNamesEnums?: number | null;
  maxEnumValues?: number | null;
  maxEnumStringLengthOver250Values?: number | null;
  recursiveDepth?: string | null;
  notes?: string | null;
}

export type ProviderId = 'openai' | 'anthropic' | 'gemini';

export const RULE_SET_IDS = ['gpt-4-o1', 'claude-4-5', 'gemini-2-5'] as const;
export type RuleSetId = (typeof RULE_SET_IDS)[number];

export interface ComparisonColumn {
  id: ProviderId;
}

export interface SchemaRuleSet {
  ruleSetId: RuleSetId;
  displayName: string;
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
  sizeLimits: SizeLimits;

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

  requirements: Requirement[];
  nullableMechanism?: string;
  behaviors: Record<string, string | boolean>;
  tips: string[];
}

export interface ComparisonRow {
  feature: string;
  openai: string;
  anthropic: string;
  gemini: string;
  openaiOk: boolean | 'warn' | 'partial';
  anthropicOk: boolean | 'partial';
  geminiOk: boolean | 'partial';
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

export interface SchemaRuleSetsMeta {
  version: string;
  lastUpdated: string;
  description: string;
  sources: Record<string, string>;
  comparisonColumns: ComparisonColumn[];
  comparisonRows: ComparisonRow[];
  sourcesDisplay: string;
  providerBadgeClasses: Record<string, string>;
  comparisonLegend: ComparisonLegend;
  universal: UniversalRules;
}

export interface SchemaRuleSetsData {
  meta: SchemaRuleSetsMeta;
  ruleSets: SchemaRuleSet[];
}
