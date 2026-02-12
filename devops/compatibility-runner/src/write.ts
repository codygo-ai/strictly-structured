import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CorpusSchema } from "~/loadCorpus.js";
import type { ModelResult } from "~/derive.js";
import { deriveGroups } from "~/group.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface CompatibilityGroup {
  id: string;
  provider: string;
  modelIds: string[];
  representative: string;
}

export interface ModelResultWithMeta extends ModelResult {
  provider: string;
  model: string;
}

export interface CompatibilityData {
  version: number;
  models: Record<string, ModelResultWithMeta>;
  schemas: Record<string, { features: string[] }>;
  groups: CompatibilityGroup[];
}

export async function writeCompatibility(
  models: Record<string, ModelResult>,
  schemas: CorpusSchema[],
  modelConfigs: Array<{ id: string; provider: string; model: string }>,
  costOrder: string[]
): Promise<void> {
  const modelToProvider = new Map(
    modelConfigs.map((c) => [c.id, c.provider])
  );
  const modelsWithMeta: Record<string, ModelResultWithMeta> = {};
  for (const c of modelConfigs) {
    const r = models[c.id];
    if (r) {
      modelsWithMeta[c.id] = {
        ...r,
        provider: c.provider,
        model: c.model,
      };
    }
  }
  const groups = deriveGroups(
    modelConfigs.map((c) => c.id),
    models,
    modelToProvider,
    costOrder
  );

  const data: CompatibilityData = {
    version: 2,
    models: modelsWithMeta,
    schemas: Object.fromEntries(
      schemas.map((s) => [s.id, { features: s.features }])
    ),
    groups,
  };
  const outPath = join(__dirname, "../data/compatibility.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function loadCostOrder(): Promise<string[]> {
  const path = join(__dirname, "../config/cost-order.json");
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}
