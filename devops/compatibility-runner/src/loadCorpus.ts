import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface CorpusSchema {
  id: string;
  features: string[];
  schema: object;
}

/**
 * Load all JSON schema files from the schema-corpus package.
 * Strips _meta from the schema for API calls; returns features for mapping.
 */
export async function loadCorpus(): Promise<CorpusSchema[]> {
  const corpusPath = join(__dirname, "../../schema-corpus/schemas");
  const files = await readdir(corpusPath);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const out: CorpusSchema[] = [];

  for (const file of jsonFiles) {
    const path = join(corpusPath, file);
    const raw = await readFile(path, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const meta = parsed._meta as { features?: string[] } | undefined;
    const features = meta?.features ?? [];
    const { _meta: _, ...schema } = parsed;
    const id = file.replace(/\.json$/, "");
    out.push({ id, features, schema: schema as object });
  }

  return out;
}
