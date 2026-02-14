/**
 * Downloads 70 JSON schema samples per model group from the JSONSchemaBench dataset
 * (Hugging Face: epfl-dlab/JSONSchemaBench). Saves to data/downloaded-samples/{groupId}/.
 * Use as basis for test cases; _meta.expected is "unknown" until validated per group.
 *
 * Run: pnpm --filter @ssv/schemas exec tsx scripts/download-json-schema-samples.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PACKAGE_ROOT, "data", "downloaded-samples");

const DATASET = "epfl-dlab/JSONSchemaBench";
const ROWS_API = "https://datasets-server.huggingface.co/rows";
const SAMPLES_PER_GROUP = 70;
const ROWS_MAX_LENGTH = 100;

const GROUPS = ["gpt-4-o1", "claude-4-5", "gemini-2-5"] as const;
const TOTAL_NEEDED = SAMPLES_PER_GROUP * GROUPS.length;

interface RowsResponse {
  rows?: Array<{ row: { json_schema: string; unique_id: string } }>;
}

function slug(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "schema";
}

async function fetchRows(config: string, split: string, offset: number, length: number): Promise<RowsResponse> {
  const url = `${ROWS_API}?dataset=${encodeURIComponent(DATASET)}&config=${encodeURIComponent(config)}&split=${encodeURIComponent(split)}&offset=${offset}&length=${length}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return (await res.json()) as RowsResponse;
}

const CONFIG_SPLITS: Array<{ config: string; split: string }> = [
  { config: "default", split: "train" },
  { config: "Github_easy", split: "train" },
  { config: "Glaiveai2K", split: "train" },
];

async function collectSchemas(): Promise<Array<{ unique_id: string; doc: Record<string, unknown> }>> {
  const collected: Array<{ unique_id: string; doc: Record<string, unknown> }> = [];
  const seenIds = new Set<string>();

  for (const { config, split } of CONFIG_SPLITS) {
    if (collected.length >= TOTAL_NEEDED) break;
    let offset = 0;
    for (;;) {
      const remaining = TOTAL_NEEDED - collected.length;
      const length = Math.min(ROWS_MAX_LENGTH, remaining);
      const data = await fetchRows(config, split, offset, length);
      const rows = data.rows ?? [];
      if (rows.length === 0) break;

      for (const { row } of rows) {
        if (seenIds.has(row.unique_id)) continue;
        let doc: Record<string, unknown>;
        try {
          doc = JSON.parse(row.json_schema) as Record<string, unknown>;
        } catch {
          continue;
        }
        if (!doc || typeof doc !== "object") continue;
        seenIds.add(row.unique_id);
        collected.push({ unique_id: row.unique_id, doc });
        if (collected.length >= TOTAL_NEEDED) break;
      }
      offset += rows.length;
      if (rows.length < length || collected.length >= TOTAL_NEEDED) break;
    }
  }

  return collected.slice(0, TOTAL_NEEDED);
}

function main(): void {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const g of GROUPS) {
    const dir = path.join(OUT_DIR, g);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  collectSchemas()
    .then((schemas) => {
      const total = schemas.length;
      const perGroup = SAMPLES_PER_GROUP;
      for (let g = 0; g < GROUPS.length; g++) {
        const groupId = GROUPS[g];
        const start = g * perGroup;
        const end = Math.min(start + perGroup, total);
        const slice = schemas.slice(start, end);
        const dir = path.join(OUT_DIR, groupId);

        for (const { unique_id, doc } of slice) {
          const name = (doc.title as string) || unique_id;
          const meta = {
            groupId,
            name: typeof name === "string" ? name : unique_id,
            description: `downloaded: JSONSchemaBench (${DATASET}) – ${unique_id}`,
            expectation: "unknown (validate per group to set expected)",
            expected: "unknown" as const,
            source: DATASET,
            unique_id,
          };
          const content = { _meta: meta, ...doc };
          const base = slug(unique_id);
          let filePath = path.join(dir, `${base}.json`);
          let n = 0;
          while (fs.existsSync(filePath)) {
            n += 1;
            filePath = path.join(dir, `${base}-${n}.json`);
          }
          fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
        }
        console.log(`${groupId}: ${slice.length} samples -> ${dir}`);
      }
      console.log(`Done. Total: ${total} schemas, ${perGroup} per group.`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

main();
