import type { CompatibilityData, ModelResult } from "./types.js";

/**
 * Map compatibility-data "supported_keywords" (feature ids like "type:string")
 * to the main keyword name for validation. A schema key like "type" is allowed
 * if any of type:string, type:number, ... is supported.
 */
const FEATURE_TO_KEYWORD: Record<string, string> = {
  "type:string": "type",
  "type:number": "type",
  "type:integer": "type",
  "type:boolean": "type",
  "type:array": "type",
  "type:object": "type",
  "type:null": "type",
  properties: "properties",
  required: "required",
  additionalProperties: "additionalProperties",
  patternProperties: "patternProperties",
  items: "items",
  "items:tuple": "items",
  prefixItems: "prefixItems",
  minItems: "minItems",
  maxItems: "maxItems",
  uniqueItems: "uniqueItems",
  minLength: "minLength",
  maxLength: "maxLength",
  pattern: "pattern",
  "format:date-time": "format",
  "format:uri": "format",
  minimum: "minimum",
  maximum: "maximum",
  exclusiveMinimum: "exclusiveMinimum",
  exclusiveMaximum: "exclusiveMaximum",
  multipleOf: "multipleOf",
  enum: "enum",
  const: "const",
  oneOf: "oneOf",
  anyOf: "anyOf",
  allOf: "allOf",
  not: "not",
  "if-then-else": "if",
  $ref: "$ref",
  $defs: "$defs",
  title: "title",
  description: "description",
};

/**
 * Return the set of supported top-level keywords for a model from compatibility data.
 * Derived from supported_keywords (feature ids) -> keyword names.
 */
export function getSupportedKeywordsForModel(
  modelId: string,
  data: CompatibilityData
): Set<string> {
  const model = data.models[modelId];
  if (!model) return new Set();
  const keywords = new Set<string>();
  for (const f of model.supported_keywords) {
    const kw = FEATURE_TO_KEYWORD[f];
    if (kw) keywords.add(kw);
  }
  return keywords;
}

/**
 * Return full model result for a model, or undefined if not in data.
 */
export function getModelResult(
  modelId: string,
  data: CompatibilityData
): ModelResult | undefined {
  return data.models[modelId];
}
