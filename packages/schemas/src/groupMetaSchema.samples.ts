/**
 * Group meta-schema test samples. Each test case lives in its own JSON file under
 * data/group-meta-schema-tests/{groupId}/{slug}.json. File format: _meta (name, description,
 * expectation, expected, expectErrorPattern?) plus the schema at top level. buildSamples() is
 * used only by scripts/emit-group-meta-schema-test-files.ts to emit those files.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

export type SampleExpected = "valid" | "invalid";

export interface GroupMetaSchemaSample {
  groupId: string;
  description: string;
  doc: Record<string, unknown>;
  expected: SampleExpected;
  expectError?: RegExp | string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = path.join(__dirname, "..", "data", "group-meta-schema-tests");

function loadSamplesFromFiles(): GroupMetaSchemaSample[] {
  const samples: GroupMetaSchemaSample[] = [];
  if (!fs.existsSync(TESTS_DIR)) return samples;
  const entries = fs.readdirSync(TESTS_DIR, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const groupDir = path.join(TESTS_DIR, ent.name);
    const files = fs.readdirSync(groupDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(groupDir, file), "utf-8");
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const { _meta, ...doc } = parsed;
      const meta = _meta as Record<string, unknown>;
      const expectErrorPattern = meta.expectErrorPattern as string | undefined;
      samples.push({
        groupId: meta.groupId as string,
        description: meta.description as string,
        doc,
        expected: meta.expected as SampleExpected,
        expectError: expectErrorPattern ? new RegExp(expectErrorPattern, "i") : undefined,
      });
    }
  }
  return samples;
}

let cachedSamples: GroupMetaSchemaSample[] | null = null;

export function getSamples(): GroupMetaSchemaSample[] {
  if (cachedSamples === null) cachedSamples = loadSamplesFromFiles();
  return cachedSamples;
}

export function getSampleCount(): number {
  return getSamples().length;
}

type Doc = Record<string, unknown>;

function obj(
  props: Record<string, unknown>,
  required?: string[],
  extra?: Doc
): Doc {
  const o: Doc = {
    type: "object",
    properties: props ?? {},
    additionalProperties: false,
    ...extra,
  };
  if (required?.length) o.required = required;
  return o;
}

function arr(items: Doc, extra?: Doc): Doc {
  return { type: "array", items, additionalProperties: false, ...extra };
}

const root = (o: Doc): Doc => o;

export function buildSamples(): GroupMetaSchemaSample[] {
  const samples: GroupMetaSchemaSample[] = [];

  // ---- GPT-4-O1: object root, allFieldsRequired, additionalProperties false, no oneOf/allOf/not, has pattern/format/numbers/items/minMax ----
  const gpt = "gpt-4-o1";

  const gptValid: Array<[string, Doc]> = [
    ["minimal object", obj({ name: { type: "string" } }, ["name"])],
    ["object with required and additionalProperties false", obj({ a: { type: "string" } }, ["a"])],
    ["string enum", obj({ k: { type: "string", enum: ["x", "y"] } }, ["k"])],
    ["string const", obj({ k: { type: "string", const: "only" } }, ["k"])],
    ["string description", obj({ k: { type: "string", description: "desc" } }, ["k"])],
    ["string pattern", obj({ k: { type: "string", pattern: "^[a-z]+$" } }, ["k"])],
    ["string format date-time", obj({ t: { type: "string", format: "date-time" } }, ["t"])],
    ["string format date", obj({ t: { type: "string", format: "date" } }, ["t"])],
    ["string format time", obj({ t: { type: "string", format: "time" } }, ["t"])],
    ["string format uuid", obj({ u: { type: "string", format: "uuid" } }, ["u"])],
    ["string format ipv4", obj({ ip: { type: "string", format: "ipv4" } }, ["ip"])],
    ["string format ipv6", obj({ ip: { type: "string", format: "ipv6" } }, ["ip"])],
    ["string format hostname", obj({ h: { type: "string", format: "hostname" } }, ["h"])],
    ["string format duration", obj({ d: { type: "string", format: "duration" } }, ["d"])],
    ["number with minimum maximum", obj({ n: { type: "number", minimum: 0, maximum: 100 } }, ["n"])],
    ["number multipleOf", obj({ n: { type: "number", multipleOf: 0.01 } }, ["n"])],
    ["number exclusiveMin/Max", obj({ n: { type: "number", exclusiveMinimum: 0, exclusiveMaximum: 1 } }, ["n"])],
    ["integer min max", obj({ i: { type: "integer", minimum: 0, maximum: 10 } }, ["i"])],
    ["integer multipleOf", obj({ i: { type: "integer", multipleOf: 2 } }, ["i"])],
    ["boolean", obj({ b: { type: "boolean" } }, ["b"])],
    ["null", obj({ n: { type: "null" } }, ["n"])],
    ["array items", obj({ arr: { type: "array", items: { type: "string" } } }, ["arr"])],
    ["array minItems maxItems", obj({ arr: { type: "array", items: { type: "number" }, minItems: 1, maxItems: 10 } }, ["arr"])],
    ["nested object", obj({ inner: obj({ x: { type: "string" } }, ["x"]) }, ["inner"])],
    ["nested array of objects", obj({ list: arr(obj({ id: { type: "integer" } }, ["id"])) }, ["list"])],
    ["anyOf two types", obj({ v: { anyOf: [{ type: "string" }, { type: "number" }] } }, ["v"])],
    ["anyOf with object", obj({ v: { anyOf: [{ type: "object", properties: {}, additionalProperties: false }, { type: "string" }] } }, ["v"])],
    ["$ref to definitions", { type: "object", properties: { p: { $ref: "#/definitions/Leaf" } }, required: ["p"], additionalProperties: false, definitions: { Leaf: { type: "string" } } }],
    ["definitions with nested ref", { type: "object", properties: { a: { $ref: "#/definitions/A" } }, required: ["a"], additionalProperties: false, definitions: { A: obj({ b: { $ref: "#/definitions/B" } }, ["b"]), B: { type: "integer" } } }],
    ["deep nesting 3 levels", obj({ l1: obj({ l2: obj({ l3: { type: "boolean" } }, ["l3"]) }, ["l2"]) }, ["l1"])],
    ["multiple properties all required", obj({ a: { type: "string" }, b: { type: "integer" }, c: { type: "array", items: { type: "boolean" } } }, ["a", "b", "c"])],
    ["enum with many values", obj({ e: { type: "string", enum: ["a", "b", "c", "d", "e"] } }, ["e"])],
    ["const number", obj({ n: { type: "number", const: 42 } }, ["n"])],
    ["const boolean", obj({ b: { type: "boolean", const: true } }, ["b"])],
    ["object with description", obj({ d: { type: "string", description: "A field" } }, ["d"])],
    ["array of enums", obj({ tags: { type: "array", items: { type: "string", enum: ["x", "y"] } } }, ["tags"])],
    ["number description", obj({ n: { type: "number", description: "Count" } }, ["n"])],
    ["integer description", obj({ i: { type: "integer", description: "Index" } }, ["i"])],
    ["boolean description", obj({ b: { type: "boolean", description: "Flag" } }, ["b"])],
    ["nullable via type array", obj({ s: { type: ["string", "null"] } }, ["s"])],
    ["format mix", obj({ dt: { type: "string", format: "date-time" }, uuid: { type: "string", format: "uuid" } }, ["dt", "uuid"])],
    ["anyOf three branches", obj({ v: { anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] } }, ["v"])],
    ["recursive definitions", { type: "object", properties: { node: { $ref: "#/definitions/Node" } }, required: ["node"], additionalProperties: false, definitions: { Node: { type: "object", properties: { value: { type: "string" }, child: { $ref: "#/definitions/Node" } }, additionalProperties: false } } }],
    ["mixed types in object", obj({ s: { type: "string" }, n: { type: "number" }, i: { type: "integer" }, b: { type: "boolean" }, a: { type: "array", items: { type: "null" } }, o: obj({ x: { type: "number" } }, ["x"]) }, ["s", "n", "i", "b", "a", "o"])],
    ["exclusiveMinimum Maximum integer", obj({ i: { type: "integer", exclusiveMinimum: 0, exclusiveMaximum: 100 } }, ["i"])],
    ["anyOf with nested object", obj({ v: { anyOf: [obj({ a: { type: "string" } }, ["a"]), { type: "integer" }] } }, ["v"])],
    ["definitions multiple", { type: "object", properties: { a: { $ref: "#/definitions/A" }, b: { $ref: "#/definitions/B" } }, required: ["a", "b"], additionalProperties: false, definitions: { A: { type: "string" }, B: { type: "integer" } } }],
    ["array of anyOf", obj({ list: { type: "array", items: { anyOf: [{ type: "string" }, { type: "number" }] } } }, ["list"])],
    ["object with multiple string formats", obj({ dt: { type: "string", format: "date-time" }, u: { type: "string", format: "uuid" }, ip4: { type: "string", format: "ipv4" } }, ["dt", "u", "ip4"])],
  ];
  for (const [desc, doc] of gptValid) {
    samples.push({ groupId: gpt, description: `valid: ${desc}`, doc: root(doc), expected: "valid" });
  }

  const gptInvalid: Array<[string, Doc, RegExp | string]> = [
    ["oneOf at root", { type: "object", properties: {}, required: [], additionalProperties: false, oneOf: [{ type: "string" }] }, /additional propert|oneOf/i],
    ["allOf at root", { type: "object", properties: {}, required: [], additionalProperties: false, allOf: [{ type: "object" }] }, /additional propert|allOf/i],
    ["not at root", { type: "object", properties: {}, required: [], additionalProperties: false, not: { type: "null" } }, /additional propert|not/i],
    ["if at root", { type: "object", properties: {}, required: [], additionalProperties: false, if: { type: "object" }, then: {} }, /additional propert|if/i],
    ["then at root", { type: "object", properties: {}, required: [], additionalProperties: false, then: {} }, /additional propert|then/i],
    ["else at root", { type: "object", properties: {}, required: [], additionalProperties: false, else: {} }, /additional propert|else/i],
    ["minLength in string", obj({ s: { type: "string", minLength: 1 } }, ["s"]), /additional propert|minLength/i],
    ["maxLength in string", obj({ s: { type: "string", maxLength: 100 } }, ["s"]), /additional propert|maxLength/i],
    ["patternProperties", obj({ x: { type: "object", patternProperties: { "^a": { type: "string" } }, additionalProperties: false } }, ["x"]), /additional propert|patternProperties/i],
    ["propertyNames", obj({ x: { type: "object", propertyNames: { pattern: "^a" }, additionalProperties: false } }, ["x"]), /additional propert|propertyNames/i],
    ["minProperties", obj({ x: { type: "object", minProperties: 1, additionalProperties: false } }, ["x"]), /additional propert|minProperties/i],
    ["maxProperties", obj({ x: { type: "object", maxProperties: 10, additionalProperties: false } }, ["x"]), /additional propert|maxProperties/i],
    ["prefixItems", obj({ arr: { type: "array", prefixItems: [{ type: "string" }], additionalProperties: false } }, ["arr"]), /additional propert|prefixItems/i],
    ["contains", obj({ arr: { type: "array", items: { type: "string" }, contains: { type: "number" } } }, ["arr"]), /additional propert|contains/i],
    ["uniqueItems", obj({ arr: { type: "array", items: { type: "string" }, uniqueItems: true } }, ["arr"]), /additional propert|uniqueItems/i],
    ["oneOf inside property", obj({ v: { oneOf: [{ type: "string" }, { type: "number" }] } }, ["v"]), /additional propert|oneOf/i],
    ["allOf inside property", obj({ v: { allOf: [{ type: "string" }] } }, ["v"]), /additional propert|allOf/i],
    ["not inside property", obj({ v: { not: { type: "null" } } }, ["v"]), /additional propert|not/i],
    ["dependentRequired", obj({ o: { type: "object", dependentRequired: { a: ["b"] }, additionalProperties: false } }, ["o"]), /additional propert|dependent/i],
    ["if then else", obj({ v: { if: { type: "string" }, then: { minLength: 1 }, else: { type: "number" } } }, ["v"]), /additional propert|if|then|else/i],
    ["unevaluatedProperties", obj({ o: { type: "object", unevaluatedProperties: false, additionalProperties: false } }, ["o"]), /additional propert|unevaluatedProperties/i],
  ];
  for (const [desc, doc, err] of gptInvalid) {
    samples.push({ groupId: gpt, description: `invalid: ${desc}`, doc: root(doc), expected: "invalid", expectError: err });
  }

  // ---- CLAUDE-4-5: object root, no pattern/format/minLength/maxLength, no number constraints except description, no minItems/maxItems ----
  const claude = "claude-4-5";

  const claudeValid: Array<[string, Doc]> = [
    ["minimal object", obj({ name: { type: "string" } }, ["name"])],
    ["object without required", obj({ x: { type: "string" } })],
    ["string enum", obj({ k: { type: "string", enum: ["a", "b"] } }, ["k"])],
    ["string const", obj({ k: { type: "string", const: "x" } }, ["k"])],
    ["string description", obj({ k: { type: "string", description: "help" } }, ["k"])],
    ["number description only", obj({ n: { type: "number", description: "value" } }, ["n"])],
    ["integer description only", obj({ i: { type: "integer", description: "index" } }, ["i"])],
    ["boolean", obj({ b: { type: "boolean" } }, ["b"])],
    ["null", obj({ n: { type: "null" } }, ["n"])],
    ["array items", obj({ arr: { type: "array", items: { type: "string" } } })],
    ["array items with description", obj({ arr: { type: "array", items: { type: "number" }, description: "list" } })],
    ["nested object", obj({ inner: obj({ x: { type: "string" } }) })],
    ["anyOf", obj({ v: { anyOf: [{ type: "string" }, { type: "integer" }] } }, ["v"])],
    ["$ref and definitions", { type: "object", properties: { p: { $ref: "#/definitions/S" } }, additionalProperties: false, definitions: { S: { type: "string" } } }],
    ["deep nesting", obj({ a: obj({ b: obj({ c: { type: "boolean" } }) }) })],
    ["multiple optional properties", obj({ a: { type: "string" }, b: { type: "number" }, c: { type: "array", items: { type: "boolean" } } })],
    ["enum array", obj({ tags: { type: "array", items: { type: "string", enum: ["x", "y"] } } })],
    ["nullable type array", obj({ s: { type: ["string", "null"] } }, ["s"])],
    ["anyOf with object", obj({ v: { anyOf: [{ type: "object", properties: {}, additionalProperties: false }, { type: "string" }] } })],
    ["object description", obj({ o: { type: "object", properties: {}, additionalProperties: false, description: "empty" } })],
    ["array of objects", obj({ list: { type: "array", items: obj({ id: { type: "integer" } }) } })],
    ["const number", obj({ n: { type: "number", const: 0 } }, ["n"])],
    ["const boolean", obj({ b: { type: "boolean", const: false } }, ["b"])],
    ["recursive definitions", { type: "object", properties: { node: { $ref: "#/definitions/N" } }, additionalProperties: false, definitions: { N: { type: "object", properties: { v: { type: "string" }, next: { $ref: "#/definitions/N" } }, additionalProperties: false } } }],
    ["empty object", obj({})],
    ["only optional props", obj({ a: { type: "string" }, b: { type: "integer" }, c: { type: "boolean" }, d: { type: "array", items: { type: "null" } } })],
    ["anyOf with three options", obj({ v: { anyOf: [{ type: "string" }, { type: "number" }, { type: "object", properties: {}, additionalProperties: false }] } })],
    ["nested anyOf", obj({ v: { anyOf: [{ type: "array", items: { anyOf: [{ type: "string" }, { type: "integer" }] } }, { type: "boolean" }] } })],
    ["definitions with two refs", { type: "object", properties: { a: { $ref: "#/definitions/A" }, b: { $ref: "#/definitions/B" } }, additionalProperties: false, definitions: { A: { type: "string" }, B: { type: "number" } } }],
    ["enum with one value", obj({ e: { type: "string", enum: ["only"] } }, ["e"])],
    ["const null", obj({ n: { type: "null", const: null } }, ["n"])],
  ];
  for (const [desc, doc] of claudeValid) {
    samples.push({ groupId: claude, description: `valid: ${desc}`, doc: root(doc), expected: "valid" });
  }

  const claudeInvalid: Array<[string, Doc, RegExp | string]> = [
    ["pattern in string", obj({ s: { type: "string", pattern: "^a" } }), /additional propert|pattern/i],
    ["format in string", obj({ s: { type: "string", format: "date-time" } }), /additional propert|format/i],
    ["minLength", obj({ s: { type: "string", minLength: 1 } }), /additional propert|minLength/i],
    ["maxLength", obj({ s: { type: "string", maxLength: 10 } }), /additional propert|maxLength/i],
    ["minimum in number", obj({ n: { type: "number", minimum: 0 } }), /additional propert|minimum/i],
    ["maximum in number", obj({ n: { type: "number", maximum: 100 } }), /additional propert|maximum/i],
    ["multipleOf in number", obj({ n: { type: "number", multipleOf: 0.5 } }), /additional propert|multipleOf/i],
    ["minimum in integer", obj({ i: { type: "integer", minimum: 0 } }), /additional propert|minimum/i],
    ["minItems", obj({ arr: { type: "array", items: { type: "string" }, minItems: 1 } }), /additional propert|minItems/i],
    ["maxItems", obj({ arr: { type: "array", items: { type: "string" }, maxItems: 5 } }), /additional propert|maxItems/i],
    ["oneOf at root", { type: "object", properties: {}, additionalProperties: false, oneOf: [] }, /additional propert|oneOf/i],
    ["allOf at root", { type: "object", properties: {}, additionalProperties: false, allOf: [] }, /additional propert|allOf/i],
    ["not at root", { type: "object", properties: {}, additionalProperties: false, not: {} }, /additional propert|not/i],
    ["oneOf in nested", obj({ v: { oneOf: [{ type: "string" }] } }), /additional propert|oneOf/i],
    ["patternProperties", obj({ o: { type: "object", patternProperties: {}, additionalProperties: false } }), /additional propert|patternProperties/i],
    ["propertyNames", obj({ o: { type: "object", propertyNames: { type: "string" }, additionalProperties: false } }), /additional propert|propertyNames/i],
    ["prefixItems", obj({ arr: { type: "array", prefixItems: [], additionalProperties: false } }), /additional propert|prefixItems/i],
    ["uniqueItems", obj({ arr: { type: "array", items: { type: "string" }, uniqueItems: true } }), /additional propert|uniqueItems/i],
    ["contains", obj({ arr: { type: "array", items: { type: "string" }, contains: { type: "string" } } }), /additional propert|contains/i],
    ["exclusiveMinimum number", obj({ n: { type: "number", exclusiveMinimum: 0 } }), /additional propert|exclusiveMinimum/i],
    ["exclusiveMaximum integer", obj({ i: { type: "integer", exclusiveMaximum: 10 } }), /additional propert|exclusiveMaximum/i],
  ];
  for (const [desc, doc, err] of claudeInvalid) {
    samples.push({ groupId: claude, description: `invalid: ${desc}`, doc: root(doc), expected: "invalid", expectError: err });
  }

  // ---- GEMINI-2-5: object or array root, format (date-time, date, time), min/max number, prefixItems, minItems, maxItems, title, no $defs (only $ref) ----
  const gemini = "gemini-2-5";

  const geminiValid: Array<[string, Doc]> = [
    ["object root minimal", obj({ name: { type: "string" } })],
    ["array root", arr({ type: "string" })],
    ["array of numbers", arr({ type: "number" })],
    ["array of objects", arr(obj({ id: { type: "integer" } }))],
    ["string format date-time", obj({ t: { type: "string", format: "date-time" } })],
    ["string format date", obj({ t: { type: "string", format: "date" } })],
    ["string format time", obj({ t: { type: "string", format: "time" } })],
    ["string enum", obj({ e: { type: "string", enum: ["a", "b"] } })],
    ["string description and title", obj({ s: { type: "string", description: "d", title: "T" } })],
    ["number minimum maximum", obj({ n: { type: "number", minimum: 0, maximum: 1 } })],
    ["number enum", obj({ n: { type: "number", enum: [1, 2, 3] } })],
    ["integer minimum maximum", obj({ i: { type: "integer", minimum: 0, maximum: 10 } })],
    ["integer enum", obj({ i: { type: "integer", enum: [0, 1] } })],
    ["boolean with title", obj({ b: { type: "boolean", title: "Flag" } })],
    ["object with title", obj({ o: { type: "object", properties: {}, additionalProperties: false, title: "Empty" } })],
    ["array items with title", obj({ arr: { type: "array", items: { type: "string" }, title: "List" } })],
    ["tuple via items array", obj({ tuple: { type: "array", items: [{ type: "string" }, { type: "integer" }], additionalProperties: false } })],
    ["minItems maxItems", obj({ arr: { type: "array", items: { type: "boolean" }, minItems: 0, maxItems: 10 } })],
    ["anyOf", obj({ v: { anyOf: [{ type: "string" }, { type: "array", items: { type: "number" } }] } })],
    ["$ref with definitions", { type: "object", properties: { p: { $ref: "#/definitions/X" } }, additionalProperties: false, definitions: { X: { type: "string" } } }],
    ["nested object with title", obj({ inner: { type: "object", properties: { x: { type: "string" } }, additionalProperties: false, title: "Inner" } })],
    ["deep array", arr(arr({ type: "integer" }))],
    ["nullable type", obj({ s: { type: ["string", "null"] } })],
    ["multiple formats", obj({ dt: { type: "string", format: "date-time" }, d: { type: "string", format: "date" }, t: { type: "string", format: "time" } })],
    ["number and integer with min max", obj({ n: { type: "number", minimum: 0, maximum: 1 }, i: { type: "integer", minimum: 0, maximum: 99 } })],
    ["array of enums", obj({ tags: { type: "array", items: { type: "string", enum: ["a", "b"] } } })],
    ["tuple of three via items", obj({ t: { type: "array", items: [{ type: "string" }, { type: "number" }, { type: "boolean" }], additionalProperties: false } })],
    ["object with required", obj({ a: { type: "string" }, b: { type: "integer" } }, ["a", "b"])],
    ["description on multiple keywords", obj({ s: { type: "string", description: "S" }, n: { type: "number", description: "N", minimum: 0 } })],
    ["anyOf with format", obj({ v: { anyOf: [{ type: "string", format: "date" }, { type: "integer" }] } })],
    ["complex nested", obj({ data: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } }, additionalProperties: false } } }, additionalProperties: false } })],
    ["array root with items object", arr(obj({ k: { type: "string" } }))],
    ["array root with items array", { type: "array", items: { type: "array", items: { type: "number" } } }],
    ["title on multiple", obj({ s: { type: "string", title: "S" }, n: { type: "number", title: "N", minimum: 0, maximum: 1 } })],
    ["array with minItems", obj({ t: { type: "array", items: { type: "string" }, minItems: 2, additionalProperties: false } })],
    ["definitions ref in array", { type: "array", items: { $ref: "#/definitions/Item" }, definitions: { Item: { type: "object", properties: { x: { type: "string" } }, additionalProperties: false } } }],
  ];
  for (const [desc, doc] of geminiValid) {
    samples.push({ groupId: gemini, description: `valid: ${desc}`, doc: root(doc), expected: "valid" });
  }

  const geminiInvalid: Array<[string, Doc, RegExp | string]> = [
    ["oneOf at root", { type: "object", properties: {}, additionalProperties: false, oneOf: [{ type: "string" }] }, /additional propert|oneOf/i],
    ["allOf at root", { type: "object", properties: {}, additionalProperties: false, allOf: [] }, /additional propert|allOf/i],
    ["not at root", { type: "object", properties: {}, additionalProperties: false, not: {} }, /additional propert|not/i],
    ["pattern in string", obj({ s: { type: "string", pattern: "^x" } }), /additional propert|pattern/i],
    ["minLength in string", obj({ s: { type: "string", minLength: 1 } }), /additional propert|minLength/i],
    ["maxLength in string", obj({ s: { type: "string", maxLength: 10 } }), /additional propert|maxLength/i],
    ["format not allowed", obj({ s: { type: "string", format: "uuid" } }), /additional propert|format|enum|allowed values/i],
    ["format hostname", obj({ s: { type: "string", format: "hostname" } }), /additional propert|format|enum|allowed values/i],
    ["multipleOf in number", obj({ n: { type: "number", multipleOf: 0.5 } }), /additional propert|multipleOf/i],
    ["exclusiveMinimum in number", obj({ n: { type: "number", exclusiveMinimum: 0 } }), /additional propert|exclusiveMinimum/i],
    ["exclusiveMaximum in number", obj({ n: { type: "number", exclusiveMaximum: 1 } }), /additional propert|exclusiveMaximum/i],
    ["multipleOf in integer", obj({ i: { type: "integer", multipleOf: 2 } }), /additional propert|multipleOf/i],
    ["uniqueItems", obj({ arr: { type: "array", items: { type: "string" }, uniqueItems: true } }), /additional propert|uniqueItems/i],
    ["contains", obj({ arr: { type: "array", items: { type: "string" }, contains: { type: "string" } } }), /additional propert|contains/i],
    ["oneOf inside property", obj({ v: { oneOf: [{ type: "string" }] } }), /additional propert|oneOf/i],
    ["patternProperties", obj({ o: { type: "object", patternProperties: {}, additionalProperties: false } }), /additional propert|patternProperties/i],
    ["unevaluatedProperties", obj({ o: { type: "object", unevaluatedProperties: false, additionalProperties: false } }), /additional propert|unevaluatedProperties/i],
  ];
  for (const [desc, doc, err] of geminiInvalid) {
    samples.push({ groupId: gemini, description: `invalid: ${desc}`, doc: root(doc), expected: "invalid", expectError: err });
  }

  return samples;
}
