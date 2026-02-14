import groupsData from "@ssv/schemas/data/groups" with { type: "json" };
import type { ProviderId } from "./types";

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

  supportedTypes: SupportedType[];
  stringFormats?: string[];
  composition?: { supported: string[]; unsupported: string[]; notes?: string };
  limits: GroupLimits;

  rootType: string | string[];
  rootAnyOfAllowed: boolean;
  allFieldsRequired: boolean;
  additionalPropertiesMustBeFalse: boolean;
  additionalPropertiesFalseRecommended?: boolean;

  hardConstraints: Array<{ rule: string; detail: string; severity: string }>;
  bestPractices: string[];
}

export interface GroupsMeta {
  version: string;
  lastUpdated: string;
  description: string;
  sources: Record<string, string>;
}

const data = groupsData as { meta: GroupsMeta; groups: StructuredOutputGroup[] };

export function getGroups(): StructuredOutputGroup[] {
  return data.groups;
}

export function getMeta(): GroupsMeta {
  return data.meta;
}

export function getGroupByProvider(providerId: ProviderId): StructuredOutputGroup | undefined {
  return data.groups.find((g) => g.providerId === providerId);
}

export function getGroupsByProviders(
  providerIds?: ProviderId[]
): StructuredOutputGroup[] {
  if (!providerIds || providerIds.length === 0) return data.groups;
  return data.groups.filter((g) => providerIds.includes(g.providerId));
}
