/**
 * Compatibility data shape produced by the runner and consumed by web/schema-utils.
 * Single source of truth: technical data (models, supported_keywords) + user-facing
 * copy (displayName, rule text, error messages, suggestions) live in one artifact.
 */

export interface ModelResult {
  supported: string[];
  failed: Record<string, string>;
  supported_keywords: string[];
  provider?: string;
  model?: string;
}

/**
 * Per-keyword rule for a group: technical (allowed override) + user-facing (messages).
 * When allowed is undefined, "allowed" is derived from compatibility (supported_keywords).
 */
export interface KeywordRule {
  /** Override: false = disallowed (e.g. nullable for OpenAI). Omit = use compatibility. */
  allowed?: boolean;
  /** Severity for validation/editor. */
  severity?: "error" | "warning" | "info";
  /** Short rule description for requirements panel. */
  requirement?: string;
  /** Message shown on validation error / editor squiggle. */
  errorMessage?: string;
  /** Fix suggestion (e.g. "Use anyOf: [{type: 'string'}, {type: 'null'}]"). */
  suggestion?: string;
  /** Optional note for requirements panel. */
  note?: string;
}

export interface CompatibilityGroup {
  id: string;
  provider: string;
  modelIds: string[];
  representative: string;
  /** User-facing group name (e.g. "OpenAI (GPT-4.1 / 5)"). */
  displayName?: string;
  /** Optional note for requirements panel. */
  note?: string;
  /** Per-keyword rules: display text + optional allowed override. Key = JSON Schema keyword. */
  keywordRules?: Record<string, KeywordRule>;
  /** Non-trivial default sample schema for this group (shown when group is selected; same logical doc, written to group rules). */
  sampleSchema?: string;
}

export interface CompatibilityData {
  version: number;
  models: Record<string, ModelResult>;
  schemas: Record<string, { features: string[] }>;
  /** Groups: technical (id, modelIds, representative) + display (displayName, note, keywordRules). */
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
