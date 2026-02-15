/**
 * Validates that generated per–rule-set meta-schemas accept valid schemas and reject
 * invalid ones with correct errors. Uses AJV to validate each sample schema against
 * the corresponding meta-schema. Runs 150+ samples. See docs/VOCABULARY.md.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { buildGroupMetaSchemaFromGroup } from "./groupMetaSchema.js";
import { getSamples } from "./groupMetaSchema.samples.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(PACKAGE_ROOT, "data", "schema_rule_sets.json");
const DRAFT_07_PATH = path.join(PACKAGE_ROOT, "data", "draft-07-meta-schema.json");

function loadJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

/** Returns a function that validates a schema document against the given meta-schema. */
function createValidator(metaSchema: Record<string, unknown>, schemaKey: string) {
  const ajv = new Ajv({ strict: false, validateFormats: true });
  addFormats(ajv);
  const metaSchemaWithId = { ...metaSchema, $id: `http://ssv/rule-set-meta/${schemaKey}#` };
  ajv.addSchema(metaSchemaWithId);
  return (schemaDoc: Record<string, unknown>) => {
    const valid = ajv.validate(metaSchemaWithId.$id as string, schemaDoc);
    return { valid: !!valid, errors: ajv.errors ?? null };
  };
}

function errorMessage(errors: Array<{ message?: string; params?: unknown }> | null): string {
  if (!errors?.length) return "";
  return errors.map((e) => e.message ?? JSON.stringify(e.params)).join(" ");
}

describe("rule-set meta-schema validation", () => {
  const baseMetaSchema = loadJson<Record<string, unknown>>(DRAFT_07_PATH);
  const ruleSetsData = loadJson<{ ruleSets: Array<{ ruleSetId: string; [key: string]: unknown }> }>(DATA_PATH);
  const samples = getSamples();

  const validators: Record<string, (doc: Record<string, unknown>) => { valid: boolean; errors: unknown }> = {};
  for (const ruleSet of ruleSetsData.ruleSets) {
    const metaSchema = buildGroupMetaSchemaFromGroup(baseMetaSchema, ruleSet) as Record<string, unknown>;
    validators[ruleSet.ruleSetId] = createValidator(metaSchema, ruleSet.ruleSetId);
  }

  it("has at least 150 samples", () => {
    expect(samples.length).toBeGreaterThanOrEqual(150);
  });

  for (const sample of samples) {
    const validate = validators[sample.ruleSetId];
    it(`${sample.ruleSetId}: ${sample.description}`, () => {
      expect(validate).toBeDefined();
      const result = validate(sample.doc);
      const msg = errorMessage(result.errors as Array<{ message?: string; params?: unknown }>);

      if (sample.expected === "valid") {
        expect(result.valid, msg || "expected valid").toBe(true);
      } else {
        expect(result.valid).toBe(false);
        expect(result.errors).not.toBeNull();
        const expectErr = sample.expectError;
        if (expectErr !== undefined) {
          if (typeof expectErr === "string") {
            expect(msg).toContain(expectErr);
          } else {
            expect(msg).toMatch(expectErr);
          }
        }
      }
    });
  }
});
