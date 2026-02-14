/**
 * Builds a draft-07 JSON Schema meta-schema per group. Uses full group (display + machine);
 * errors if machine is missing. No I/O; pure functions.
 */

const DRAFT_07 = "http://json-schema.org/draft-07/schema#";
const DEF_NAME = "groupSchemaObject";

export interface GroupMetaSchemaInput {
  rootType: "object" | ["object", "array"];
  rootAnyOfAllowed: boolean;
  allFieldsRequired: boolean;
  additionalPropertiesMustBeFalse: boolean;
  supportedStringKeywords: string[];
  supportedStringFormats: string[];
  supportedNumberKeywords: string[];
  supportedIntegerKeywords: string[];
  supportedBooleanKeywords: string[];
  supportedObjectKeywords: string[];
  supportedArrayKeywords: string[];
  supportedCompositionKeywords: string[];
  unsupportedCompositionKeywords: string[];
}

interface MachineLike {
  rootType?: string | string[];
  rootAnyOfAllowed?: boolean;
  allFieldsRequired?: boolean;
  additionalPropertiesMustBeFalse?: boolean;
  supportedStringKeywords?: string[];
  supportedStringFormats?: string[];
  supportedNumberKeywords?: string[];
  supportedIntegerKeywords?: string[];
  supportedBooleanKeywords?: string[];
  supportedObjectKeywords?: string[];
  supportedArrayKeywords?: string[];
  supportedCompositionKeywords?: string[];
  unsupportedCompositionKeywords?: string[];
}

function arr(x: unknown): string[] {
  if (Array.isArray(x)) return x.filter((v): v is string => typeof v === "string");
  return [];
}

export function normalizeGroupInput(group: {
  display?: unknown;
  machine?: unknown;
}): GroupMetaSchemaInput {
  const m = group.machine as MachineLike | undefined;
  if (!m || typeof m !== "object") {
    throw new Error("Group is missing machine; cannot generate group meta-schema.");
  }
  const rootTypeRaw = m.rootType;
  const rootType: "object" | ["object", "array"] =
    Array.isArray(rootTypeRaw) && rootTypeRaw.length === 2
      ? (rootTypeRaw as ["object", "array"])
      : "object";

  return {
    rootType,
    rootAnyOfAllowed: Boolean(m.rootAnyOfAllowed),
    allFieldsRequired: Boolean(m.allFieldsRequired),
    additionalPropertiesMustBeFalse: Boolean(m.additionalPropertiesMustBeFalse),
    supportedStringKeywords: arr(m.supportedStringKeywords),
    supportedStringFormats: arr(m.supportedStringFormats),
    supportedNumberKeywords: arr(m.supportedNumberKeywords),
    supportedIntegerKeywords: arr(m.supportedIntegerKeywords),
    supportedBooleanKeywords: arr(m.supportedBooleanKeywords),
    supportedObjectKeywords: arr(m.supportedObjectKeywords),
    supportedArrayKeywords: arr(m.supportedArrayKeywords),
    supportedCompositionKeywords: arr(m.supportedCompositionKeywords),
    unsupportedCompositionKeywords: arr(m.unsupportedCompositionKeywords),
  };
}

function schemaRef(ref: string): { $ref: string } {
  return { $ref: ref };
}

function buildRoot(input: GroupMetaSchemaInput): Record<string, unknown> {
  const rootTypeSchema =
    input.rootType === "object"
      ? { type: "string" as const, enum: ["object"] as const }
      : { type: "string" as const, enum: ["object", "array"] as const };

  const rootConstraints: Record<string, unknown> = {
    type: "object",
    required: ["type"],
    properties: {
      type: rootTypeSchema,
    },
  };

  return {
    $schema: DRAFT_07,
    allOf: [rootConstraints, schemaRef(`#/$defs/${DEF_NAME}`)],
  };
}

function stringBranch(input: GroupMetaSchemaInput, _ref: string): Record<string, unknown> {
  const keywords = [...input.supportedStringKeywords];
  const props: Record<string, unknown> = {
    type: {
      oneOf: [
        { type: "string", enum: ["string"] },
        { type: "array", items: { type: "string" }, contains: { const: "string" } },
      ],
    },
  };
  for (const kw of keywords) {
    if (kw === "enum") props.enum = { type: "array" };
    else if (kw === "const") props.const = {};
    else if (kw === "description" || kw === "title") props[kw] = { type: "string" };
    else if (kw === "pattern") props.pattern = { type: "string" };
    else if (kw === "format") {
      props.format =
        input.supportedStringFormats.length > 0
          ? { type: "string", enum: input.supportedStringFormats }
          : { type: "string" };
    } else props[kw] = {};
  }
  return {
    type: "object",
    required: ["type"],
    properties: props,
    additionalProperties: false,
  };
}

function objectBranch(input: GroupMetaSchemaInput, ref: string): Record<string, unknown> {
  const keywords = input.supportedObjectKeywords;
  const props: Record<string, unknown> = {
    type: {
      oneOf: [
        { type: "string", enum: ["object"] },
        { type: "array", items: { type: "string" }, contains: { const: "object" } },
      ],
    },
  };
  for (const kw of keywords) {
    if (kw === "properties") props.properties = { type: "object", additionalProperties: schemaRef(ref) };
    else if (kw === "additionalProperties") props.additionalProperties = { oneOf: [{ enum: [false] }, schemaRef(ref)] };
    else if (kw === "required") props.required = { type: "array", items: { type: "string" } };
    else if (kw === "description" || kw === "title") props[kw] = { type: "string" };
    else props[kw] = {};
  }
  return {
    type: "object",
    required: ["type"],
    properties: props,
    additionalProperties: false,
  };
}

function arrayBranch(input: GroupMetaSchemaInput, ref: string): Record<string, unknown> {
  const keywords = input.supportedArrayKeywords;
  const props: Record<string, unknown> = {
    type: {
      oneOf: [
        { type: "string", enum: ["array"] },
        { type: "array", items: { type: "string" }, contains: { const: "array" } },
      ],
    },
  };
  for (const kw of keywords) {
    if (kw === "items") props.items = schemaRef(ref);
    else if (kw === "prefixItems") props.prefixItems = { type: "array", items: schemaRef(ref) };
    else if (kw === "description" || kw === "title") props[kw] = { type: "string" };
    else if (kw === "minItems" || kw === "maxItems") props[kw] = { type: "integer" };
    else props[kw] = {};
  }
  return {
    type: "object",
    required: ["type"],
    properties: props,
    additionalProperties: false,
  };
}

function numberBranch(input: GroupMetaSchemaInput): Record<string, unknown> {
  const keywords = input.supportedNumberKeywords;
  const props: Record<string, unknown> = {
    type: {
      oneOf: [
        { type: "string", enum: ["number"] },
        { type: "array", items: { type: "string" }, contains: { const: "number" } },
      ],
    },
  };
  for (const kw of keywords) {
    if (kw === "description" || kw === "title") props[kw] = { type: "string" };
    else if (kw === "enum") props.enum = { type: "array" };
    else props[kw] = {};
  }
  return {
    type: "object",
    required: ["type"],
    properties: props,
    additionalProperties: false,
  };
}

function integerBranch(input: GroupMetaSchemaInput): Record<string, unknown> {
  const keywords = input.supportedIntegerKeywords;
  const props: Record<string, unknown> = {
    type: {
      oneOf: [
        { type: "string", enum: ["integer"] },
        { type: "array", items: { type: "string" }, contains: { const: "integer" } },
      ],
    },
  };
  for (const kw of keywords) {
    if (kw === "description" || kw === "title") props[kw] = { type: "string" };
    else if (kw === "enum") props.enum = { type: "array" };
    else props[kw] = {};
  }
  return {
    type: "object",
    required: ["type"],
    properties: props,
    additionalProperties: false,
  };
}

function booleanBranch(input: GroupMetaSchemaInput): Record<string, unknown> {
  const keywords = input.supportedBooleanKeywords;
  const props: Record<string, unknown> = {
    type: {
      oneOf: [
        { type: "string", enum: ["boolean"] },
        { type: "array", items: { type: "string" }, contains: { const: "boolean" } },
      ],
    },
  };
  for (const kw of keywords) {
    if (kw === "description" || kw === "title") props[kw] = { type: "string" };
    else props[kw] = {};
  }
  return {
    type: "object",
    required: ["type"],
    properties: props,
    additionalProperties: false,
  };
}

function nullBranch(): Record<string, unknown> {
  return {
    type: "object",
    required: ["type"],
    properties: {
      type: {
        oneOf: [
          { type: "string", enum: ["null"] },
          { type: "array", items: { type: "string" }, contains: { const: "null" } },
        ],
      },
    },
    additionalProperties: false,
  };
}

function refOnlyBranch(ref: string): Record<string, unknown> {
  const supportsDefs = true;
  const props: Record<string, unknown> = {
    $ref: { type: "string" },
  };
  if (supportsDefs) {
    props.$defs = { type: "object", additionalProperties: schemaRef(ref) };
  }
  return {
    type: "object",
    required: ["$ref"],
    properties: props,
    additionalProperties: false,
  };
}

function anyOfBranch(input: GroupMetaSchemaInput, ref: string): Record<string, unknown> | null {
  if (!input.supportedCompositionKeywords.includes("anyOf")) return null;
  return {
    type: "object",
    required: ["anyOf"],
    properties: {
      anyOf: { type: "array", items: schemaRef(ref) },
    },
    additionalProperties: false,
  };
}

function buildGroupSchemaObject(input: GroupMetaSchemaInput): Record<string, unknown> {
  const ref = `#/$defs/${DEF_NAME}`;
  const branches: Record<string, unknown>[] = [];

  branches.push(refOnlyBranch(ref));

  const anyOfB = anyOfBranch(input, ref);
  if (anyOfB) branches.push(anyOfB);

  branches.push(stringBranch(input, ref));
  branches.push(objectBranch(input, ref));
  branches.push(arrayBranch(input, ref));
  branches.push(numberBranch(input));
  branches.push(integerBranch(input));
  branches.push(booleanBranch(input));
  branches.push(nullBranch());

  return {
    oneOf: branches,
  };
}

export function buildGroupMetaSchema(input: GroupMetaSchemaInput): Record<string, unknown> {
  const root = buildRoot(input);
  const defs = {
    [DEF_NAME]: buildGroupSchemaObject(input),
  };
  return {
    ...root,
    $defs: defs,
  };
}

export function buildGroupMetaSchemaFromGroup(group: {
  groupId: string;
  display?: unknown;
  machine?: unknown;
}): Record<string, unknown> {
  const input = normalizeGroupInput(group);
  return buildGroupMetaSchema(input);
}
