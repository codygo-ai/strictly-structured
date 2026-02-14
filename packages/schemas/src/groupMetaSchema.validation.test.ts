/**
 * Validates that generated group meta-schemas accept good documents and reject bad ones
 * with correct errors. Uses ajv to run meta-schema validation. Runs 150+ samples covering
 * the full JSON Schema (draft-07) feature set.
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
const DATA_PATH = path.join(PACKAGE_ROOT, "data", "structured_output_groups.json");
const DRAFT_07_PATH = path.join(PACKAGE_ROOT, "data", "draft-07-meta-schema.json");

function loadJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function createValidator(metaSchema: Record<string, unknown>, schemaKey: string) {
  const ajv = new Ajv({ strict: false, validateFormats: true });
  addFormats(ajv);
  const schema = { ...metaSchema, $id: `http://ssv/group-meta/${schemaKey}#` };
  ajv.addSchema(schema);
  return (doc: Record<string, unknown>) => {
    const valid = ajv.validate(schema.$id as string, doc);
    return { valid: !!valid, errors: ajv.errors ?? null };
  };
}

function errorMessage(errors: Array<{ message?: string; params?: unknown }> | null): string {
  if (!errors?.length) return "";
  return errors.map((e) => e.message ?? JSON.stringify(e.params)).join(" ");
}

describe("group meta-schema validation", () => {
  const baseMetaSchema = loadJson<Record<string, unknown>>(DRAFT_07_PATH);
  const groupsData = loadJson<{ groups: Array<{ groupId: string; display?: unknown; machine?: unknown }> }>(DATA_PATH);
  const samples = getSamples();

  const validators: Record<string, (doc: Record<string, unknown>) => { valid: boolean; errors: unknown }> = {};
  for (const group of groupsData.groups) {
    const metaSchema = buildGroupMetaSchemaFromGroup(baseMetaSchema, group) as Record<string, unknown>;
    validators[group.groupId] = createValidator(metaSchema, group.groupId);
  }

  it("has at least 150 samples", () => {
    expect(samples.length).toBeGreaterThanOrEqual(150);
  });

  for (const sample of samples) {
    const validate = validators[sample.groupId];
    it(`${sample.groupId}: ${sample.description}`, () => {
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
