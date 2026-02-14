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

describe("groupMetaSchema", () => {
  it("normalizeGroupInput throws when machine is missing", () => {
    expect(() => normalizeGroupInput({})).toThrow("missing machine");
    expect(() => normalizeGroupInput({ display: {} })).toThrow("missing machine");
  });

  it("buildGroupMetaSchemaFromGroup produces draft-07 meta-schema with $defs and root type", () => {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(raw) as {
      groups: Array<{ groupId: string; display?: unknown; machine?: unknown }>;
    };
    const first = data.groups[0];
    expect(first).toBeDefined();
    expect(first.groupId).toBe("gpt-4-o1");

    const schema = buildGroupMetaSchemaFromGroup(first) as Record<string, unknown>;
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(schema.$defs).toBeDefined();
    const defs = schema.$defs as Record<string, unknown>;
    expect(defs.groupSchemaObject).toBeDefined();

    const allOf = schema.allOf as Array<Record<string, unknown>>;
    expect(Array.isArray(allOf)).toBe(true);
    const rootConstraints = allOf[0];
    expect(rootConstraints.type).toBe("object");
    expect(rootConstraints.required).toContain("type");
    const typeProp = (rootConstraints.properties as Record<string, unknown>).type as Record<string, unknown>;
    expect(typeProp.enum).toEqual(["object"]);
  });

  it("buildGroupMetaSchema from normalized input has correct root for object-only group", () => {
    const input = normalizeGroupInput({
      machine: {
        rootType: "object",
        rootAnyOfAllowed: false,
        supportedStringKeywords: ["description"],
        supportedStringFormats: [],
        supportedNumberKeywords: [],
        supportedIntegerKeywords: [],
        supportedBooleanKeywords: [],
        supportedObjectKeywords: ["properties", "required", "additionalProperties", "description"],
        supportedArrayKeywords: ["items", "description"],
        supportedCompositionKeywords: ["$ref", "$defs"],
        unsupportedCompositionKeywords: ["allOf", "oneOf"],
      },
    });
    const schema = buildGroupMetaSchema(input) as Record<string, unknown>;
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    const allOf = schema.allOf as Array<Record<string, unknown>>;
    const rootConstraints = allOf[0];
    const typeProp = (rootConstraints.properties as Record<string, unknown>).type as Record<string, unknown>;
    expect(typeProp.enum).toEqual(["object"]);
  });

  it("buildGroupMetaSchema for group with rootType array allows object or array at root", () => {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(raw) as {
      groups: Array<{ groupId: string; machine?: unknown }>;
    };
    const gemini = data.groups.find((g) => g.groupId === "gemini-2-5");
    expect(gemini).toBeDefined();

    const schema = buildGroupMetaSchemaFromGroup(gemini!) as Record<string, unknown>;
    const allOf = schema.allOf as Array<Record<string, unknown>>;
    const rootConstraints = allOf[0];
    const typeProp = (rootConstraints.properties as Record<string, unknown>).type as Record<string, unknown>;
    expect(typeProp.enum).toEqual(["object", "array"]);
  });
});
