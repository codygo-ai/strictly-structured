#!/usr/bin/env node
/* global process, console */

/**
 * Standalone JSON Schema validator for LLM structured outputs.
 * Zero dependencies — pure Node.js ESM.
 *
 * Validation algorithm matches packages/mcp-server/src/lib/validator.ts
 * to ensure consistent results across both distribution paths.
 *
 * Usage:
 *   node validate.mjs --schema-file <path> --rules-file <path> [--provider <id>]
 *   node validate.mjs --schema '<json>' --rules-file <path> [--provider <id>]
 */

import { readFileSync } from "node:fs";

// --- CLI argument parsing ---

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const schemaFile = getArg("--schema-file");
const schemaInline = getArg("--schema");
const rulesFile = getArg("--rules-file");
const providerFilter = getArg("--provider");

if (!rulesFile) {
  console.error("Usage: node validate.mjs --rules-file <path> (--schema-file <path> | --schema '<json>')");
  process.exit(2);
}

let schemaStr;
if (schemaFile) {
  schemaStr = readFileSync(schemaFile, "utf-8");
} else if (schemaInline) {
  schemaStr = schemaInline;
} else {
  console.error("Provide either --schema-file or --schema");
  process.exit(2);
}

let schema;
try {
  schema = JSON.parse(schemaStr);
} catch (e) {
  console.error(JSON.stringify({ error: `Invalid JSON schema: ${e.message}` }));
  process.exit(1);
}

const rulesData = JSON.parse(readFileSync(rulesFile, "utf-8"));

// --- Validation logic (mirrors packages/mcp-server/src/lib/validator.ts) ---

const COMPOSITION_KEYWORDS = new Set([
  "anyOf", "allOf", "oneOf", "not",
  "if", "then", "else",
  "dependentRequired", "dependentSchemas",
  "$ref", "$defs",
]);

const STRUCTURAL_KEYWORDS = new Set(["type"]);

function resolveType(node) {
  const t = node.type;
  if (typeof t === "string") return t;
  if (Array.isArray(t)) {
    const nonNull = t.filter((v) => v !== "null");
    if (nonNull.length === 1 && typeof nonNull[0] === "string") return nonNull[0];
  }
  return undefined;
}

function buildSupportedKeywordsByType(supportedTypes) {
  return new Map(supportedTypes.map((st) => [st.type, new Set(st.supportedKeywords)]));
}

function validateSchemaForRuleSet(s, ruleSet) {
  if (s === null || typeof s !== "object") {
    return { valid: false, errors: ["Schema must be an object"], warnings: [] };
  }

  const rules = {
    rootType: ruleSet.rootType,
    rootAnyOfAllowed: ruleSet.rootAnyOfAllowed,
    allFieldsRequired: ruleSet.allFieldsRequired,
    additionalPropertiesMustBeFalse: ruleSet.additionalPropertiesMustBeFalse,
    additionalPropertiesFalseRecommended: ruleSet.additionalPropertiesFalseRecommended,
    supportedStringFormats: ruleSet.stringFormats ?? [],
    limits: {
      maxProperties: ruleSet.sizeLimits?.maxProperties ?? null,
      maxNestingDepth: ruleSet.sizeLimits?.maxNestingDepth ?? null,
      maxStringLengthNamesEnums: ruleSet.sizeLimits?.maxStringLengthNamesEnums ?? null,
      maxEnumValues: ruleSet.sizeLimits?.maxEnumValues ?? null,
    },
  };

  const ctx = {
    rules,
    errors: [],
    warnings: [],
    supportedComposition: new Set(ruleSet.composition?.supported ?? []),
    supportedKeywordsByType: buildSupportedKeywordsByType(ruleSet.supportedTypes),
    supportedTypesSet: new Set(ruleSet.supportedTypes.map((st) => st.type)),
    totalProperties: 0,
    maxDepthSeen: 0,
    totalEnumValues: 0,
    totalStringLengthNamesEnums: 0,
  };

  walkNode(s, "root", 0, true, ctx);
  checkQuantitativeLimits(ctx);

  return { valid: ctx.errors.length === 0, errors: ctx.errors, warnings: ctx.warnings };
}

function walkNode(node, path, depth, isRoot, ctx) {
  if (depth > ctx.maxDepthSeen) ctx.maxDepthSeen = depth;

  const nodeType = resolveType(node);

  // Multi-type union detection
  const rawType = node.type;
  if (Array.isArray(rawType)) {
    const nonNull = rawType.filter((v) => v !== "null");
    if (nonNull.length > 1) {
      ctx.errors.push(`Multi-type unions are not supported at ${path}. Use anyOf for union types`);
    }
  }

  if (isRoot) checkRootConstraints(node, nodeType, ctx);

  if (nodeType && !ctx.supportedTypesSet.has(nodeType)) {
    ctx.errors.push(`Type "${nodeType}" is not supported by this provider at ${path}`);
  }

  checkNodeKeywords(node, nodeType, path, isRoot, ctx);

  if (nodeType === "object" || node.properties !== undefined) {
    checkObjectConstraints(node, path, ctx);
  }

  if (nodeType === "string" && typeof node.format === "string") {
    checkStringFormat(node.format, path, ctx);
  }

  accumulateStats(node, ctx);
  recurseChildren(node, path, depth, ctx);
}

function checkRootConstraints(node, nodeType, ctx) {
  const { rules } = ctx;
  const allowedRoots = Array.isArray(rules.rootType) ? rules.rootType : [rules.rootType];

  if (nodeType && !allowedRoots.includes(nodeType)) {
    ctx.errors.push(`Root type must be ${allowedRoots.join(" or ")}, got "${nodeType}"`);
  }

  if (
    !rules.rootAnyOfAllowed &&
    node.anyOf !== undefined &&
    ctx.supportedComposition.has("anyOf")
  ) {
    ctx.errors.push("Root-level anyOf is not allowed for this provider");
  }
}

function checkNodeKeywords(node, nodeType, path, isRoot, ctx) {
  const { supportedComposition } = ctx;
  const typeSupported = nodeType ? ctx.supportedKeywordsByType.get(nodeType) : undefined;

  for (const key of Object.keys(node)) {
    if (STRUCTURAL_KEYWORDS.has(key)) continue;

    if (COMPOSITION_KEYWORDS.has(key)) {
      if (isRoot && key === "anyOf" && supportedComposition.has("anyOf")) continue;
      if (!supportedComposition.has(key)) {
        ctx.errors.push(`"${key}" is not supported by this provider at ${path}`);
      }
      continue;
    }

    if (typeSupported && !typeSupported.has(key)) {
      ctx.errors.push(`"${key}" is not supported for type "${nodeType}" by this provider at ${path}`);
    }
  }
}

function checkObjectConstraints(node, path, ctx) {
  const { rules } = ctx;

  if (rules.additionalPropertiesMustBeFalse && node.additionalProperties !== false) {
    if (node.additionalProperties === undefined) {
      ctx.errors.push(`Missing "additionalProperties": false at ${path} — required by this provider`);
    } else {
      ctx.errors.push(`"additionalProperties" must be false at ${path} for this provider`);
    }
  }

  if (
    !rules.additionalPropertiesMustBeFalse &&
    rules.additionalPropertiesFalseRecommended &&
    node.additionalProperties !== false &&
    node.properties !== undefined
  ) {
    ctx.warnings.push(`"additionalProperties": false is recommended at ${path} for reliable results`);
  }

  if (rules.allFieldsRequired && node.properties !== undefined) {
    const props = node.properties;
    if (props && typeof props === "object") {
      const propKeys = Object.keys(props);
      const required = Array.isArray(node.required) ? node.required : [];
      const missing = propKeys.filter((k) => !required.includes(k));
      if (missing.length > 0) {
        ctx.errors.push(`All properties must be in "required" at ${path}. Missing: ${missing.join(", ")}`);
      }
    }
  }
}

function checkStringFormat(format, path, ctx) {
  const formats = ctx.rules.supportedStringFormats;
  if (!formats || formats.length === 0) return;

  if (!formats.includes(format)) {
    ctx.errors.push(`String format "${format}" is not supported at ${path}. Supported: ${formats.join(", ")}`);
  }
}

function accumulateStats(node, ctx) {
  if (node.properties && typeof node.properties === "object") {
    const keys = Object.keys(node.properties);
    ctx.totalProperties += keys.length;
    for (const key of keys) {
      ctx.totalStringLengthNamesEnums += key.length;
    }
  }

  if (Array.isArray(node.enum)) {
    ctx.totalEnumValues += node.enum.length;
    for (const val of node.enum) {
      if (typeof val === "string") {
        ctx.totalStringLengthNamesEnums += val.length;
      }
    }
  }
}

function recurseChildren(node, path, depth, ctx) {
  if (node.properties && typeof node.properties === "object") {
    for (const [key, value] of Object.entries(node.properties)) {
      if (value && typeof value === "object") {
        walkNode(value, `${path}.properties.${key}`, depth + 1, false, ctx);
      }
    }
  }

  if (node.items && typeof node.items === "object") {
    walkNode(node.items, `${path}.items`, depth + 1, false, ctx);
  }

  if (Array.isArray(node.prefixItems)) {
    node.prefixItems.forEach((item, i) => {
      if (item && typeof item === "object") {
        walkNode(item, `${path}.prefixItems[${i}]`, depth + 1, false, ctx);
      }
    });
  }

  if (Array.isArray(node.anyOf)) {
    node.anyOf.forEach((branch, i) => {
      if (branch && typeof branch === "object") {
        walkNode(branch, `${path}.anyOf[${i}]`, depth, false, ctx);
      }
    });
  }

  if (node.$defs && typeof node.$defs === "object") {
    for (const [key, value] of Object.entries(node.$defs)) {
      if (value && typeof value === "object") {
        walkNode(value, `${path}.$defs.${key}`, 0, false, ctx);
      }
    }
  }

  if (node.additionalProperties && typeof node.additionalProperties === "object") {
    walkNode(node.additionalProperties, `${path}.additionalProperties`, depth + 1, false, ctx);
  }
}

function checkQuantitativeLimits(ctx) {
  const { limits } = ctx.rules;
  if (!limits) return;

  if (typeof limits.maxProperties === "number" && ctx.totalProperties > limits.maxProperties) {
    ctx.errors.push(`Schema has ${ctx.totalProperties} total properties, exceeding the limit of ${limits.maxProperties}`);
  }

  if (typeof limits.maxNestingDepth === "number" && ctx.maxDepthSeen > limits.maxNestingDepth) {
    ctx.errors.push(`Schema nesting depth is ${ctx.maxDepthSeen}, exceeding the limit of ${limits.maxNestingDepth}`);
  }

  if (typeof limits.maxEnumValues === "number" && ctx.totalEnumValues > limits.maxEnumValues) {
    ctx.errors.push(`Schema has ${ctx.totalEnumValues} total enum values, exceeding the limit of ${limits.maxEnumValues}`);
  }

  if (typeof limits.maxStringLengthNamesEnums === "number" && ctx.totalStringLengthNamesEnums > limits.maxStringLengthNamesEnums) {
    ctx.errors.push(`Total string length of property names and enum values is ${ctx.totalStringLengthNamesEnums}, exceeding the limit of ${limits.maxStringLengthNamesEnums}`);
  }
}

// --- Run validation ---

let ruleSets = rulesData.ruleSets;
if (providerFilter) {
  ruleSets = ruleSets.filter((r) => r.providerId === providerFilter);
  if (ruleSets.length === 0) {
    console.error(JSON.stringify({ error: `Unknown provider: ${providerFilter}` }));
    process.exit(1);
  }
}

const results = ruleSets.map((ruleSet) => {
  const { valid, errors, warnings } = validateSchemaForRuleSet(schema, ruleSet);
  return {
    provider: ruleSet.providerId,
    ruleSetId: ruleSet.ruleSetId,
    displayName: ruleSet.displayName,
    valid,
    errors,
    warnings,
  };
});

const validProviders = results.filter((r) => r.valid).map((r) => r.provider);
const invalidProviders = results.filter((r) => !r.valid).map((r) => r.provider);
const summary =
  validProviders.length === results.length
    ? `Valid for all ${results.length} providers.`
    : invalidProviders.length === results.length
      ? `Invalid for all ${results.length} providers.`
      : `Valid for ${validProviders.length}/${results.length} providers (${validProviders.join(", ")}). Issues found for: ${invalidProviders.join(", ")}.`;

console.log(JSON.stringify({ results, summary }, null, 2));
process.exit(invalidProviders.length > 0 ? 1 : 0);
