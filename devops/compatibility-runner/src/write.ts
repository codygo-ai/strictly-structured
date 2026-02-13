import { writeFile, mkdir, readFile, rename } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CompatibilityGroup, KeywordRule } from "@ssv/schema-utils";
import type { CorpusSchema } from "~/loadCorpus.js";
import type { ModelResult } from "~/derive.js";
import { deriveGroups } from "~/group.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface DisplayGroupConfig {
  displayName?: string;
  note?: string;
  keywordRules?: Record<string, KeywordRule>;
  sampleSchema?: string;
}

interface DisplayConfig {
  groups?: Record<string, DisplayGroupConfig>;
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

/** True if no model has any real result (all technical errors). Don't overwrite good data. */
function hasNoRealResults(models: Record<string, ModelResult>): boolean {
  for (const r of Object.values(models)) {
    if (r.supported.length > 0 || Object.keys(r.failed).length > 0) return false;
  }
  return true;
}

/** Returns true if data was written, false if skipped (no-keys run). */
export async function writeCompatibility(
  models: Record<string, ModelResult>,
  schemas: CorpusSchema[],
  modelConfigs: Array<{ id: string; provider: string; model: string }>,
  costOrder: string[]
): Promise<boolean> {
  if (hasNoRealResults(models)) {
    console.warn(
      "No real results (all technical errors). Not overwriting compatibility.json."
    );
    return false;
  }

  const modelToProvider = new Map(
    modelConfigs.map((c) => [c.id, c.provider])
  );
  const modelsWithMeta: Record<string, ModelResultWithMeta> = {};
  for (const c of modelConfigs) {
    const r = models[c.id];
    const hasRealResults =
      r && (r.supported.length > 0 || Object.keys(r.failed).length > 0);
    if (hasRealResults && r) {
      modelsWithMeta[c.id] = {
        ...r,
        provider: c.provider,
        model: c.model,
      };
    }
  }
  let groups = deriveGroups(
    Object.keys(modelsWithMeta),
    modelsWithMeta,
    modelToProvider,
    costOrder
  );

  // Merge display config (user-facing copy) into groups → single source of truth
  const displayPath = join(__dirname, "../config/display-config.json");
  try {
    const displayRaw = await readFile(displayPath, "utf-8");
    const displayConfig: DisplayConfig = JSON.parse(displayRaw);
    if (displayConfig.groups) {
      groups = groups.map((g) => {
        const display = displayConfig.groups![g.representative];
        if (!display) return g;
        return {
          ...g,
          displayName: display.displayName ?? g.displayName,
          note: display.note ?? g.note,
          keywordRules:
            display.keywordRules != null
              ? { ...g.keywordRules, ...display.keywordRules }
              : g.keywordRules,
          sampleSchema: display.sampleSchema ?? g.sampleSchema,
        };
      });
    }
  } catch (e) {
    // display-config optional: no merge if missing or invalid
  }

  const data: CompatibilityData = {
    version: 3,
    models: modelsWithMeta,
    schemas: Object.fromEntries(
      schemas.map((s) => [s.id, { features: s.features }])
    ),
    groups,
  };
  const outDir = join(__dirname, "../data");
  const outPath = join(outDir, "compatibility.json");
  const tmpPath = join(outDir, "compatibility.json.tmp");
  await mkdir(outDir, { recursive: true });
  await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  await rename(tmpPath, outPath);
  console.log("Wrote", resolve(outPath));
  return true;
}

export async function loadCostOrder(): Promise<string[]> {
  const path = join(__dirname, "../config/cost-order.json");
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}
