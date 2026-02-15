import ruleSetsData from "@ssv/schemas/data/rule-sets" with { type: "json" };
import type { ProviderId } from "./types";

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
}

export interface SchemaRuleSet {
  ruleSetId: string;
  displayName: string;
  provider: string;
  providerId: ProviderId;
  docUrl: string;
  description: string;
  models: string[];
  modelNotes?: string;

  supportedTypes: SupportedType[];
  stringFormats?: string[];
  composition?: { supported: string[]; unsupported: string[]; notes?: string };
  sizeLimits: SizeLimits;

  rootType: string | string[];
  rootAnyOfAllowed: boolean;
  allFieldsRequired: boolean;
  additionalPropertiesMustBeFalse: boolean;
  additionalPropertiesFalseRecommended?: boolean;

  requirements: Array<{ rule: string; detail: string; severity: string }>;
  tips: string[];
}

export interface RuleSetsMeta {
  version: string;
  lastUpdated: string;
  description: string;
  sources: Record<string, string>;
}

const data = ruleSetsData as { meta: RuleSetsMeta; ruleSets: SchemaRuleSet[] };

export function getRuleSets(): SchemaRuleSet[] {
  return data.ruleSets;
}

export function getRuleSetsMeta(): RuleSetsMeta {
  return data.meta;
}

export function getRuleSetByProvider(providerId: ProviderId): SchemaRuleSet | undefined {
  return data.ruleSets.find((r) => r.providerId === providerId);
}

export function getRuleSetsByProviders(
  providerIds?: ProviderId[]
): SchemaRuleSet[] {
  if (!providerIds || providerIds.length === 0) return data.ruleSets;
  return data.ruleSets.filter((r) => providerIds.includes(r.providerId));
}
