import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import {
  buildGroupMetaSchema,
  buildGroupMetaSchemaFromGroup,
  normalizeGroupInput,
} from "./groupMetaSchema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(PACKAGE_ROOT, "data", "structured_output_groups.json");
const DRAFT_07_PATH = path.join(PACKAGE_ROOT, "data", "draft-07-meta-schema.json");

function loadBaseMetaSchema(): Record<string, unknown> {
  const raw = fs.readFileSync(DRAFT_07_PATH, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

describe("groupMetaSchema", () => {
  it("normalizeGroupInput throws when supportedTypes is missing", () => {
    expect(() => normalizeGroupInput({})).toThrow("missing supportedTypes");
    expect(() => normalizeGroupInput({ rootType: "object" })).toThrow("missing supportedTypes");
  });

  it("buildGroupMetaSchemaFromGroup produces draft-07 subset with definitions and restricted properties", () => {
    const base = loadBaseMetaSchema();
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(raw) as {
      groups: Array<{ groupId: string; [key: string]: unknown }>;
    };
    const first = data.groups[0];
    expect(first).toBeDefined();
    expect(first.groupId).toBe("gpt-4-o1");

    const schema = buildGroupMetaSchemaFromGroup(base, first) as Record<string, unknown>;
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(schema.definitions).toBeDefined();
    expect((schema.definitions as Record<string, unknown>).schemaArray).toBeDefined();
    expect(schema.additionalProperties).toBe(false);
    const props = schema.properties as Record<string, unknown>;
    expect(props.oneOf).toBeUndefined();
    expect(props.anyOf).toBeDefined();
  });

  it("buildGroupMetaSchema from normalized input removes unsupported keywords", () => {
    const base = loadBaseMetaSchema();
    const input = normalizeGroupInput({
      rootType: "object",
      rootAnyOfAllowed: false,
      supportedTypes: [
        { type: "string", supportedKeywords: ["description"] },
        { type: "number", supportedKeywords: [] },
        { type: "integer", supportedKeywords: [] },
        { type: "boolean", supportedKeywords: [] },
        { type: "object", supportedKeywords: ["properties", "required", "additionalProperties", "description"] },
        { type: "array", supportedKeywords: ["items", "description"] },
      ],
      stringFormats: [],
      composition: {
        supported: ["$ref", "anyOf"],
        unsupported: ["allOf", "oneOf"],
      },
    });
    const schema = buildGroupMetaSchema(base, input) as Record<string, unknown>;
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(schema.additionalProperties).toBe(false);
    const props = schema.properties as Record<string, unknown>;
    expect(props.oneOf).toBeUndefined();
    expect(props.allOf).toBeUndefined();
  });

  it("buildGroupMetaSchema for gemini removes unsupported composition keywords", () => {
    const base = loadBaseMetaSchema();
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(raw) as {
      groups: Array<{ groupId: string; [key: string]: unknown }>;
    };
    const gemini = data.groups.find((g) => g.groupId === "gemini-2-5");
    expect(gemini).toBeDefined();

    const schema = buildGroupMetaSchemaFromGroup(base, gemini!) as Record<string, unknown>;
    expect(schema.additionalProperties).toBe(false);
    const props = schema.properties as Record<string, unknown>;
    expect(props.oneOf).toBeUndefined();
    expect(props.anyOf).toBeDefined();
  });
});
