/**
 * Emits one JSON file per test case under data/group-meta-schema-tests/{ruleSetId}/{slug}.json.
 * Each file is self-contained: _meta (name, description, expectation, expected, expectErrorPattern?)
 * plus the schema at top level (all keys from doc). Run: pnpm --filter @ssv/schemas exec tsx scripts/emit-group-meta-schema-test-files.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { buildSamples } from "../src/groupMetaSchema.samples.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(PACKAGE_ROOT, "data", "group-meta-schema-tests");

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "unnamed";
}

function main(): void {
  const samples = buildSamples();
  const byRuleSet = new Map<string, string>();
  for (const s of samples) {
    const dir = path.join(OUT_DIR, s.ruleSetId);
    if (!byRuleSet.has(s.ruleSetId)) {
      fs.mkdirSync(dir, { recursive: true });
      byRuleSet.set(s.ruleSetId, dir);
    }
    const base = slug(s.description.replace(/^(valid|invalid):\s*/i, "").trim());
    let name = base;
    let n = 0;
    let filePath = path.join(dir, `${name}.json`);
    while (fs.existsSync(filePath)) {
      n += 1;
      name = `${base}-${n}`;
      filePath = path.join(dir, `${name}.json`);
    }
    const expectErrorPattern =
      s.expectError instanceof RegExp ? s.expectError.source : typeof s.expectError === "string" ? s.expectError : undefined;
    const expectation =
      s.expected === "valid" ? "valid" : expectErrorPattern ? `invalid: error must match ${expectErrorPattern}` : "invalid";
    const meta = {
      ruleSetId: s.ruleSetId,
      name: s.description.replace(/^(valid|invalid):\s*/i, "").trim(),
      description: s.description,
      expectation,
      expected: s.expected,
      ...(expectErrorPattern && { expectErrorPattern }),
    };
    const content = { _meta: meta, ...s.doc };
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
  }
  const total = samples.length;
  const ruleSetIds = [...byRuleSet.keys()].sort();
  console.log(`Emitted ${total} test files under ${OUT_DIR}`);
  for (const r of ruleSetIds) {
    const count = samples.filter((s) => s.ruleSetId === r).length;
    console.log(`  ${r}: ${count} files`);
  }
}

main();
