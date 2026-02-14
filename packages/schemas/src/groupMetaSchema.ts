/**
 * Builds a group meta-schema as a subset of the draft-07 JSON Schema meta-schema:
 * start from the full draft-07 meta-schema and restrict by removing unsupported
 * keywords and applying group-specific root rules. Uses full group (display + machine);
 * errors if machine is missing. No I/O; pure functions (base schema passed in).
 */

const DRAFT_07 = "http://json-schema.org/draft-07/schema#";

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
  unsupportedStringKeywords: string[];
  unsupportedNumberKeywords: string[];
  unsupportedIntegerKeywords: string[];
  unsupportedObjectKeywords: string[];
  unsupportedArrayKeywords: string[];
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
  unsupportedStringKeywords?: string[];
  unsupportedNumberKeywords?: string[];
  unsupportedIntegerKeywords?: string[];
  unsupportedObjectKeywords?: string[];
  unsupportedArrayKeywords?: string[];
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
    unsupportedStringKeywords: arr(m.unsupportedStringKeywords),
    unsupportedNumberKeywords: arr(m.unsupportedNumberKeywords),
    unsupportedIntegerKeywords: arr(m.unsupportedIntegerKeywords),
    unsupportedObjectKeywords: arr(m.unsupportedObjectKeywords),
    unsupportedArrayKeywords: arr(m.unsupportedArrayKeywords),
  };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function allUnsupportedKeywords(input: GroupMetaSchemaInput): Set<string> {
  const set = new Set<string>();
  for (const k of input.unsupportedCompositionKeywords) set.add(k);
  for (const k of input.unsupportedStringKeywords) set.add(k);
  for (const k of input.unsupportedNumberKeywords) set.add(k);
  for (const k of input.unsupportedIntegerKeywords) set.add(k);
  for (const k of input.unsupportedObjectKeywords) set.add(k);
  for (const k of input.unsupportedArrayKeywords) set.add(k);
  return set;
}

/**
 * Returns a group meta-schema that is a subset of the draft-07 meta-schema:
 * same structure and size as the base, with unsupported keywords removed and
 * group-specific root rules applied.
 */
export function buildGroupMetaSchema(
  baseMetaSchema: Record<string, unknown>,
  input: GroupMetaSchemaInput
): Record<string, unknown> {
  const base = deepClone(baseMetaSchema) as Record<string, unknown>;
  const unsupported = allUnsupportedKeywords(input);
  const properties = base.properties as Record<string, unknown> | undefined;
  if (!properties || typeof properties !== "object") {
    return base;
  }

  for (const key of Object.keys(properties)) {
    if (unsupported.has(key)) {
      delete properties[key];
    }
  }

  if (input.supportedStringFormats.length > 0 && "format" in properties) {
    properties.format = { type: "string", enum: input.supportedStringFormats };
  }

  base.additionalProperties = false;
  delete (base as Record<string, unknown>).default;

  base.$schema = DRAFT_07;
  return base;
}

export function buildGroupMetaSchemaFromGroup(
  baseMetaSchema: Record<string, unknown>,
  group: { groupId: string; display?: unknown; machine?: unknown }
): Record<string, unknown> {
  const input = normalizeGroupInput(group);
  return buildGroupMetaSchema(baseMetaSchema, input);
}
