import type { ModelResult } from "~/derive.js";

export interface CompatibilityGroup {
  id: string;
  provider: string;
  modelIds: string[];
  representative: string;
}

/**
 * Group models (per provider) that have identical supported_keywords (same validation behavior).
 * For each group, pick the representative = minimal-cost model in that group (by cost order).
 */
export function deriveGroups(
  modelIds: string[],
  models: Record<string, ModelResult>,
  modelToProvider: Map<string, string>,
  costOrder: string[]
): CompatibilityGroup[] {
  const costRank = new Map<string, number>();
  costOrder.forEach((id, i) => costRank.set(id, i));

  const byProvider = new Map<string, string[]>();
  for (const id of modelIds) {
    const provider = modelToProvider.get(id);
    if (!provider) continue;
    const list = byProvider.get(provider) ?? [];
    list.push(id);
    byProvider.set(provider, list);
  }

  const groups: CompatibilityGroup[] = [];
  for (const [provider, ids] of byProvider) {
    const keyToModels = new Map<string, string[]>();
    for (const id of ids) {
      const result = models[id];
      const key = result
        ? JSON.stringify(result.supported_keywords.slice().sort())
        : "[]";
      const list = keyToModels.get(key) ?? [];
      list.push(id);
      keyToModels.set(key, list);
    }
    for (const groupModelIds of keyToModels.values()) {
      const representative = groupModelIds.reduce((best, id) => {
        const rBest = costRank.get(best) ?? 1e9;
        const rId = costRank.get(id) ?? 1e9;
        return rId < rBest ? id : best;
      }, groupModelIds[0]!);
      groups.push({
        id: representative,
        provider,
        modelIds: groupModelIds.slice().sort(),
        representative,
      });
    }
  }
  return groups.sort(
    (a, b) => (costRank.get(a.representative) ?? 0) - (costRank.get(b.representative) ?? 0)
  );
}
