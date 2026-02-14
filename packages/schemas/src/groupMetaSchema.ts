/**
 * Builds a group meta-schema as a subset of the draft-07 JSON Schema meta-schema:
 * start from the full draft-07 meta-schema and restrict by removing unsupported
 * keywords and applying group-specific root rules. Uses unified group structure;
 * errors if supportedTypes is missing. No I/O; pure functions (base schema passed in).
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

interface UnifiedGroupLike {
  rootType?: string | string[];
  rootAnyOfAllowed?: boolean;
  allFieldsRequired?: boolean;
  additionalPropertiesMustBeFalse?: boolean;
  supportedTypes?: Array<{
    type: string;
    supportedKeywords?: string[];
    unsupportedKeywords?: string[];
  }>;
  stringFormats?: string[];
  composition?: {
    supported?: string[];
    unsupported?: string[];
  };
}

function arr(x: unknown): string[] {
  if (Array.isArray(x)) return x.filter((v): v is string => typeof v === "string");
  return [];
}

function findSupported(
  types: UnifiedGroupLike["supportedTypes"],
  typeName: string
): string[] {
  return arr(types?.find((t) => t.type === typeName)?.supportedKeywords);
}

function findUnsupported(
  types: UnifiedGroupLike["supportedTypes"],
  typeName: string
): string[] {
  return arr(types?.find((t) => t.type === typeName)?.unsupportedKeywords);
}

export function normalizeGroupInput(
  group: Record<string, unknown>
): GroupMetaSchemaInput {
  const g = group as unknown as UnifiedGroupLike;
  if (!g.supportedTypes || !Array.isArray(g.supportedTypes)) {
    throw new Error(
      "Group is missing supportedTypes; cannot generate group meta-schema."
    );
  }
  const rootTypeRaw = g.rootType;
  const rootType: "object" | ["object", "array"] =
    Array.isArray(rootTypeRaw) && rootTypeRaw.length === 2
      ? (rootTypeRaw as ["object", "array"])
      : "object";

  const types = g.supportedTypes;

  return {
    rootType,
    rootAnyOfAllowed: Boolean(g.rootAnyOfAllowed),
    allFieldsRequired: Boolean(g.allFieldsRequired),
    additionalPropertiesMustBeFalse: Boolean(g.additionalPropertiesMustBeFalse),
    supportedStringKeywords: findSupported(types, "string"),
    supportedStringFormats: arr(g.stringFormats),
    supportedNumberKeywords: findSupported(types, "number"),
    supportedIntegerKeywords: findSupported(types, "integer"),
    supportedBooleanKeywords: findSupported(types, "boolean"),
    supportedObjectKeywords: findSupported(types, "object"),
    supportedArrayKeywords: findSupported(types, "array"),
    supportedCompositionKeywords: arr(g.composition?.supported),
    unsupportedCompositionKeywords: arr(g.composition?.unsupported),
    unsupportedStringKeywords: findUnsupported(types, "string"),
    unsupportedNumberKeywords: findUnsupported(types, "number"),
    unsupportedIntegerKeywords: findUnsupported(types, "integer"),
    unsupportedObjectKeywords: findUnsupported(types, "object"),
    unsupportedArrayKeywords: findUnsupported(types, "array"),
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
  group: Record<string, unknown>
): Record<string, unknown> {
  const input = normalizeGroupInput(group);
  return buildGroupMetaSchema(baseMetaSchema, input);
}
