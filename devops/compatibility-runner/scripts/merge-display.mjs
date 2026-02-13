#!/usr/bin/env node
/**
 * Merge display-config.json into compatibility.json (single source of truth).
 * Run this after copying compatibility.json from a previous run, or run the
 * full compatibility runner (which does this merge automatically).
 *
 * Usage: node scripts/merge-display.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../");
const dataPath = join(root, "data/compatibility.json");
const displayPath = join(root, "config/display-config.json");

async function main() {
  const [dataRaw, displayRaw] = await Promise.all([
    readFile(dataPath, "utf-8"),
    readFile(displayPath, "utf-8"),
  ]);
  const data = JSON.parse(dataRaw);
  const displayConfig = JSON.parse(displayRaw);

  if (!data.groups || !Array.isArray(data.groups)) {
    console.error("compatibility.json has no groups array");
    process.exit(1);
  }
  const groupsConfig = displayConfig.groups || {};

  data.version = 3;
  data.groups = data.groups.map((g) => {
    const display = groupsConfig[g.representative];
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

  await writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");
  console.log("Merged display config into", dataPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
