import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CorpusSchema } from "~/loadCorpus.js";
import type { ModelResult } from "~/derive.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface CompatibilityData {
  version: number;
  models: Record<string, ModelResult>;
  schemas: Record<string, { features: string[] }>;
}

export async function writeCompatibility(
  models: Record<string, ModelResult>,
  schemas: CorpusSchema[]
): Promise<void> {
  const data: CompatibilityData = {
    version: 1,
    models,
    schemas: Object.fromEntries(
      schemas.map((s) => [s.id, { features: s.features }])
    ),
  };
  const outPath = join(__dirname, "../../compatibility-data/data/compatibility.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(data, null, 2), "utf-8");
}
