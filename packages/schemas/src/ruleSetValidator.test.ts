import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { validateSchemaForRuleSet } from "./ruleSetValidator.js";
import type { SchemaRuleSet, SchemaRuleSetsData } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(PACKAGE_ROOT, "data", "schemaRuleSets.json");
const SAMPLES_DIR = path.join(PACKAGE_ROOT, "data", "validationSamples");

interface SampleMeta {
  ruleSetId: string;
  name: string;
  description: string;
  expected: "valid" | "invalid";
  expectErrorPattern?: string;
}

interface SampleFile {
  meta: SampleMeta;
  schemaText: string;
  filePath: string;
}

function loadRuleSets(): Map<string, SchemaRuleSet> {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const data = JSON.parse(raw) as SchemaRuleSetsData;
  return new Map(data.ruleSets.map((rs) => [rs.ruleSetId, rs]));
}

function loadSamples(): SampleFile[] {
  const samples: SampleFile[] = [];
  if (!fs.existsSync(SAMPLES_DIR)) return samples;

  for (const dirEntry of fs.readdirSync(SAMPLES_DIR, { withFileTypes: true })) {
    if (!dirEntry.isDirectory()) continue;
    const groupDir = path.join(SAMPLES_DIR, dirEntry.name);
    for (const file of fs.readdirSync(groupDir).filter((f) => f.endsWith(".json"))) {
      const filePath = path.join(groupDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const { _meta, ...doc } = parsed;
      const meta = _meta as SampleMeta;
      samples.push({
        meta,
        schemaText: JSON.stringify(doc, undefined, 2),
        filePath: path.relative(PACKAGE_ROOT, filePath),
      });
    }
  }
  return samples;
}

describe("ruleSetValidator", () => {
  const ruleSetsMap = loadRuleSets();
  const samples = loadSamples();

  it("has at least 150 samples", () => {
    expect(samples.length).toBeGreaterThanOrEqual(150);
  });

  for (const sample of samples) {
    const ruleSet = ruleSetsMap.get(sample.meta.ruleSetId);

    it(`${sample.meta.ruleSetId}: ${sample.meta.description}`, () => {
      expect(ruleSet, `No rule set found for "${sample.meta.ruleSetId}"`).toBeDefined();

      const markers = validateSchemaForRuleSet(sample.schemaText, ruleSet!);
      const errors = markers.filter((m) => m.severity === "error");

      if (sample.meta.expected === "valid") {
        expect(errors, `Expected no errors for ${sample.filePath}`).toHaveLength(0);
      } else {
        expect(errors.length, `Expected errors for ${sample.filePath}`).toBeGreaterThan(0);

        if (sample.meta.expectErrorPattern) {
          const pattern = new RegExp(sample.meta.expectErrorPattern, "i");
          const allMessages = errors.map((e) => e.message).join(" ");
          expect(allMessages).toMatch(pattern);
        }
      }
    });
  }
});
