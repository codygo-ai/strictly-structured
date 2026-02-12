/**
 * Compatibility data shape produced by the runner and consumed by web/schema-utils.
 */

export interface ModelResult {
  supported: string[];
  failed: Record<string, string>;
  supported_keywords: string[];
  provider?: string;
  model?: string;
}

export interface CompatibilityGroup {
  id: string;
  provider: string;
  modelIds: string[];
  representative: string;
}

export interface CompatibilityData {
  version: number;
  models: Record<string, ModelResult>;
  schemas: Record<string, { features: string[] }>;
  /** Groups of models with identical validation behavior; representative = min-cost in group. */
  groups?: CompatibilityGroup[];
}

/**
 * Known JSON Schema keyword list (for validation and autocomplete).
 * Order and grouping can be used for UX.
 */
export const JSON_SCHEMA_KEYWORDS = [
  "type",
  "enum",
  "const",
  "properties",
  "required",
  "additionalProperties",
  "patternProperties",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "uniqueItems",
  "contains",
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "oneOf",
  "anyOf",
  "allOf",
  "not",
  "if",
  "then",
  "else",
  "$ref",
  "$defs",
  "definitions",
  "title",
  "description",
] as const;

export type JsonSchemaKeyword = (typeof JSON_SCHEMA_KEYWORDS)[number];
