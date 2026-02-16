import ruleSetsData from '@ssv/schemas/data/schemaRuleSets.json' with { type: 'json' };
import type { SchemaRuleSet, ProviderId } from '@ssv/schemas/types';
export type { SchemaRuleSet, ProviderId } from '@ssv/schemas/types';

interface RuleSetsMeta {
  version: string;
  lastUpdated: string;
  description: string;
  sources: Record<string, string>;
}

const data = ruleSetsData as unknown as { meta: RuleSetsMeta; ruleSets: SchemaRuleSet[] };

export function getRuleSets(): SchemaRuleSet[] {
  return data.ruleSets;
}

export function getRuleSetsMeta(): RuleSetsMeta {
  return data.meta;
}

export function getRuleSetByProvider(providerId: ProviderId): SchemaRuleSet | undefined {
  return data.ruleSets.find((r) => r.providerId === providerId);
}

export function getRuleSetsByProviders(providerIds?: ProviderId[]): SchemaRuleSet[] {
  if (!providerIds || providerIds.length === 0) return data.ruleSets;
  return data.ruleSets.filter((r) => providerIds.includes(r.providerId));
}
