import type { SchemaRuleSet } from "./types.js";

// ── Public types ──────────────────────────────────────────────────────

export type FixKind =
  | "root_type_wrong"
  | "root_anyof_not_allowed"
  | "multi_type_union"
  | "unsupported_type"
  | "unsupported_keyword"
  | "unsupported_composition"
  | "missing_additional_properties_false"
  | "additional_properties_not_false"
  | "missing_required_properties"
  | "unsupported_string_format"
  | "quantitative_limit_exceeded";

export interface AppliedFix {
  pointer: string;
  kind: FixKind;
  description: string;
  infoLost?: string;
}

export interface UnresolvedError {
  pointer: string;
  kind: FixKind;
  message: string;
  reason: string;
}

export interface FixResult {
  fixedSchema: JsonNode;
  appliedFixes: AppliedFix[];
  unresolvedErrors: UnresolvedError[];
}

// ── Internal types ────────────────────────────────────────────────────

type JsonNode = Record<string, unknown>;

interface FixContext {
  supportedComposition: Set<string>;
  supportedKeywordsByType: Map<string, Set<string>>;
  supportedTypesSet: Set<string>;
  supportedStringFormats: string[];
  rootType: string[];
  rootAnyOfAllowed: boolean;
  allFieldsRequired: boolean;
  additionalPropertiesMustBeFalse: boolean;
  additionalPropertiesFalseRecommended: boolean;
  fixes: AppliedFix[];
  unresolved: UnresolvedError[];
}

// ── Constants ─────────────────────────────────────────────────────────

const COMPOSITION_KEYWORDS = new Set([
  "anyOf", "allOf", "oneOf", "not", "if", "then", "else",
  "dependentRequired", "dependentSchemas", "$ref", "$defs",
]);

const STRUCTURAL_KEYWORDS = new Set(["type"]);

const CONSTRAINT_TEMPLATES: Record<string, (v: unknown) => string> = {
  minimum: (v) => `>= ${v}`,
  maximum: (v) => `<= ${v}`,
  exclusiveMinimum: (v) => `> ${v}`,
  exclusiveMaximum: (v) => `< ${v}`,
  multipleOf: (v) => `multiple of ${v}`,
  minLength: (v) => `min length: ${v}`,
  maxLength: (v) => `max length: ${v}`,
  pattern: (v) => `pattern: ${v}`,
  format: (v) => `format: ${v}`,
  minItems: (v) => `min items: ${v}`,
  maxItems: (v) => `max items: ${v}`,
  uniqueItems: () => `items must be unique`,
  prefixItems: () => `tuple structure removed`,
};

// ── Entry point ───────────────────────────────────────────────────────

export function fixSchemaForRuleSet(
  schema: JsonNode,
  ruleSet: SchemaRuleSet,
): FixResult {
  const fixed = structuredClone(schema);

  const ctx: FixContext = {
    supportedComposition: new Set(ruleSet.composition?.supported ?? []),
    supportedKeywordsByType: new Map(
      ruleSet.supportedTypes.map((st) => [st.type, new Set(st.supportedKeywords)]),
    ),
    supportedTypesSet: new Set(ruleSet.supportedTypes.map((st) => st.type)),
    supportedStringFormats: ruleSet.stringFormats ?? [],
    rootType: Array.isArray(ruleSet.rootType) ? ruleSet.rootType : [ruleSet.rootType],
    rootAnyOfAllowed: ruleSet.rootAnyOfAllowed,
    allFieldsRequired: ruleSet.allFieldsRequired,
    additionalPropertiesMustBeFalse: ruleSet.additionalPropertiesMustBeFalse,
    additionalPropertiesFalseRecommended: ruleSet.additionalPropertiesFalseRecommended ?? false,
    fixes: [],
    unresolved: [],
  };

  // Phase 1: Root structural fixes (order matters — these reshape the tree)
  fixRootType(fixed, ctx);
  fixRootAnyOf(fixed, ctx);

  // Phase 2: Recursive walk — per-node fixes
  fixWalkNode(fixed, "", true, ctx);

  return {
    fixedSchema: fixed,
    appliedFixes: ctx.fixes,
    unresolvedErrors: ctx.unresolved,
  };
}

// ── Root structural fixes ─────────────────────────────────────────────

function fixRootType(node: JsonNode, ctx: FixContext): void {
  const nodeType = resolveType(node);
  if (!nodeType || ctx.rootType.includes(nodeType)) return;

  // Wrap the entire schema in an object with a generic property
  const original: JsonNode = {};
  for (const key of Object.keys(node)) {
    original[key] = node[key];
    delete node[key];
  }

  node["type"] = "object";
  node["properties"] = { items: original };
  node["required"] = ["items"];
  if (ctx.additionalPropertiesMustBeFalse || ctx.additionalPropertiesFalseRecommended) {
    node["additionalProperties"] = false;
  }

  ctx.fixes.push({
    pointer: "",
    kind: "root_type_wrong",
    description: `Wrapped "${nodeType}" root in object with "items" property`,
    infoLost: "Wrapper property name \"items\" is generic and may need renaming",
  });
}

function fixRootAnyOf(node: JsonNode, ctx: FixContext): void {
  if (ctx.rootAnyOfAllowed) return;
  if (node["anyOf"] === undefined) return;
  if (!ctx.supportedComposition.has("anyOf")) return;

  const original: JsonNode = {};
  for (const key of Object.keys(node)) {
    original[key] = node[key];
    delete node[key];
  }

  node["type"] = "object";
  node["properties"] = { result: original };
  node["required"] = ["result"];
  if (ctx.additionalPropertiesMustBeFalse || ctx.additionalPropertiesFalseRecommended) {
    node["additionalProperties"] = false;
  }

  ctx.fixes.push({
    pointer: "",
    kind: "root_anyof_not_allowed",
    description: "Wrapped root-level anyOf in object with \"result\" property",
    infoLost: "Adds one nesting level; wrapper property name is generic",
  });
}

// ── Recursive walk ────────────────────────────────────────────────────

function fixWalkNode(
  node: JsonNode,
  pointer: string,
  _isRoot: boolean,
  ctx: FixContext,
): void {
  fixMultiTypeUnion(node, pointer, ctx);
  fixCompositionKeywords(node, pointer, ctx);

  const nodeType = resolveType(node);

  if (nodeType && !ctx.supportedTypesSet.has(nodeType)) {
    ctx.unresolved.push({
      pointer,
      kind: "unsupported_type",
      message: `Type "${nodeType}" is not supported by this provider`,
      reason: "No safe mechanical mapping to a supported type",
    });
  }

  if (nodeType) {
    fixUnsupportedKeywords(node, nodeType, pointer, ctx);
  }

  if (nodeType === "string" && typeof node["format"] === "string") {
    fixStringFormat(node, pointer, ctx);
  }

  if (nodeType === "object" || node["properties"] !== undefined) {
    fixAdditionalProperties(node, pointer, ctx);
    fixRequiredArray(node, pointer, ctx);
  }

  recurseFixChildren(node, pointer, ctx);
}

// ── Per-node fixes ────────────────────────────────────────────────────

function fixMultiTypeUnion(node: JsonNode, pointer: string, ctx: FixContext): void {
  const rawType = node["type"];
  if (!Array.isArray(rawType)) return;

  const nonNull = rawType.filter((v: unknown) => v !== "null");
  if (nonNull.length <= 1) return;

  if (!ctx.supportedComposition.has("anyOf")) {
    ctx.unresolved.push({
      pointer,
      kind: "multi_type_union",
      message: "Multi-type union requires anyOf conversion, but anyOf is not supported",
      reason: "Provider does not support anyOf",
    });
    return;
  }

  const branches: JsonNode[] = rawType.map((t: unknown) => ({ type: t }));

  const keysToRemove: string[] = ["type"];
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "description") continue;
    if (STRUCTURAL_KEYWORDS.has(key) || COMPOSITION_KEYWORDS.has(key)) continue;

    for (const branch of branches) {
      const branchType = branch["type"] as string;
      const supported = ctx.supportedKeywordsByType.get(branchType);
      if (supported?.has(key)) {
        branch[key] = node[key];
      }
    }
    keysToRemove.push(key);
  }

  for (const key of keysToRemove) delete node[key];
  node["anyOf"] = branches;

  ctx.fixes.push({
    pointer,
    kind: "multi_type_union",
    description: `Converted type union [${rawType.join(", ")}] to anyOf`,
  });
}

function fixCompositionKeywords(node: JsonNode, pointer: string, ctx: FixContext): void {
  if (node["oneOf"] !== undefined && !ctx.supportedComposition.has("oneOf")) {
    if (ctx.supportedComposition.has("anyOf")) {
      node["anyOf"] = node["oneOf"];
      delete node["oneOf"];
      appendDescription(node, "Note: exactly one variant should match (converted from oneOf)");
      ctx.fixes.push({
        pointer,
        kind: "unsupported_composition",
        description: "Converted \"oneOf\" to \"anyOf\"",
        infoLost: "Exclusivity constraint (exactly-one-match) is now a hint, not enforced",
      });
    } else {
      ctx.unresolved.push({
        pointer,
        kind: "unsupported_composition",
        message: "\"oneOf\" is not supported by this provider",
        reason: "Neither oneOf nor anyOf is supported — cannot convert",
      });
    }
  }

  if (node["allOf"] !== undefined && !ctx.supportedComposition.has("allOf")) {
    const allOf = node["allOf"];
    if (Array.isArray(allOf) && tryMergeAllOf(node, allOf as JsonNode[], pointer, ctx)) {
      // merged — fix recorded inside tryMergeAllOf
    } else {
      ctx.unresolved.push({
        pointer,
        kind: "unsupported_composition",
        message: "\"allOf\" is not supported by this provider",
        reason: "Branches have conflicts or non-object types that cannot be merged mechanically",
      });
    }
  }

  for (const kw of ["not", "if", "dependentRequired", "dependentSchemas"] as const) {
    if (node[kw] !== undefined && !ctx.supportedComposition.has(kw)) {
      const value = node[kw];
      delete node[kw];
      if (kw === "if") {
        delete node["then"];
        delete node["else"];
      }
      ctx.unresolved.push({
        pointer,
        kind: "unsupported_composition",
        message: `"${kw}" is not supported by this provider`,
        reason: `"${kw}" requires semantic understanding to replace — removed, constraint lost`,
      });
      appendDescription(node, `Removed unsupported "${kw}": ${JSON.stringify(value)}`);
    }
  }
}

function tryMergeAllOf(
  node: JsonNode,
  branches: JsonNode[],
  pointer: string,
  ctx: FixContext,
): boolean {
  const allAreObjects = branches.every(
    (b) => b["type"] === "object" || b["properties"] !== undefined,
  );
  if (!allAreObjects) return false;

  const mergedProps: JsonNode = {};
  const mergedRequired: string[] = [];

  for (const branch of branches) {
    const props = branch["properties"];
    if (props && typeof props === "object") {
      for (const [key, value] of Object.entries(props as JsonNode)) {
        if (key in mergedProps) return false;
        mergedProps[key] = value;
      }
    }
    if (Array.isArray(branch["required"])) {
      for (const r of branch["required"] as string[]) {
        if (!mergedRequired.includes(r)) mergedRequired.push(r);
      }
    }
  }

  delete node["allOf"];
  if (!node["type"]) node["type"] = "object";
  const existingProps = (node["properties"] ?? {}) as JsonNode;
  node["properties"] = { ...existingProps, ...mergedProps };
  const existingRequired = Array.isArray(node["required"])
    ? (node["required"] as string[])
    : [];
  const allRequired = [...new Set([...existingRequired, ...mergedRequired])];
  if (allRequired.length > 0) node["required"] = allRequired;

  ctx.fixes.push({
    pointer,
    kind: "unsupported_composition",
    description: `Merged allOf branches into flat object (${Object.keys(mergedProps).length} properties)`,
    infoLost: "Compositional structure lost; branches are now flat properties",
  });
  return true;
}

function fixUnsupportedKeywords(
  node: JsonNode,
  nodeType: string,
  pointer: string,
  ctx: FixContext,
): void {
  const supported = ctx.supportedKeywordsByType.get(nodeType);
  if (!supported) return;

  const promoted: string[] = [];

  for (const key of Object.keys(node)) {
    if (STRUCTURAL_KEYWORDS.has(key)) continue;
    if (COMPOSITION_KEYWORDS.has(key)) continue;
    if (supported.has(key)) continue;

    const value = node[key];
    const template = CONSTRAINT_TEMPLATES[key];
    const hint = template ? template(value) : `${key}: ${JSON.stringify(value)}`;
    promoted.push(hint);
    delete node[key];
  }

  if (promoted.length === 0) return;

  appendDescription(node, `Constraints: ${promoted.join(", ")}`);
  ctx.fixes.push({
    pointer,
    kind: "unsupported_keyword",
    description: `Moved unsupported keywords to description: ${promoted.join(", ")}`,
    infoLost: "Constraints are now hints in the description, not enforced by the schema",
  });
}

function fixStringFormat(node: JsonNode, pointer: string, ctx: FixContext): void {
  const format = node["format"] as string;
  const formats = ctx.supportedStringFormats;

  if (formats.length === 0) return;

  if (!formats.includes(format)) {
    delete node["format"];
    appendDescription(node, `format: ${format}`);
    ctx.fixes.push({
      pointer,
      kind: "unsupported_string_format",
      description: `Removed unsupported format "${format}" — moved to description`,
      infoLost: "Format validation is now a hint, not enforced",
    });
  }
}

function fixAdditionalProperties(node: JsonNode, pointer: string, ctx: FixContext): void {
  if (node["additionalProperties"] === false) return;

  if (ctx.additionalPropertiesMustBeFalse) {
    const hadValue = node["additionalProperties"] !== undefined;
    const oldValue = node["additionalProperties"];

    node["additionalProperties"] = false;

    if (hadValue && typeof oldValue === "object" && oldValue !== null) {
      ctx.fixes.push({
        pointer,
        kind: "additional_properties_not_false",
        description: "Set \"additionalProperties\" to false (was a schema)",
        infoLost: "Dynamic additional properties of specified type are no longer allowed",
      });
    } else if (hadValue) {
      ctx.fixes.push({
        pointer,
        kind: "additional_properties_not_false",
        description: "Set \"additionalProperties\" to false",
      });
    } else {
      ctx.fixes.push({
        pointer,
        kind: "missing_additional_properties_false",
        description: "Added \"additionalProperties\": false",
      });
    }
  } else if (ctx.additionalPropertiesFalseRecommended && node["properties"] !== undefined) {
    node["additionalProperties"] = false;
    ctx.fixes.push({
      pointer,
      kind: "missing_additional_properties_false",
      description: "Added recommended \"additionalProperties\": false",
    });
  }
}

function fixRequiredArray(node: JsonNode, pointer: string, ctx: FixContext): void {
  if (!ctx.allFieldsRequired) return;

  const props = node["properties"];
  if (!props || typeof props !== "object") return;

  const propKeys = Object.keys(props as JsonNode);
  const required = Array.isArray(node["required"])
    ? (node["required"] as string[])
    : [];
  const missing = propKeys.filter((k) => !required.includes(k));

  if (missing.length === 0) return;

  node["required"] = propKeys;

  const propsObj = props as JsonNode;
  for (const key of missing) {
    const propNode = propsObj[key];
    if (propNode && typeof propNode === "object") {
      makeNullable(propNode as JsonNode);
    }
  }

  ctx.fixes.push({
    pointer,
    kind: "missing_required_properties",
    description: `Added ${missing.join(", ")} to "required" and made them nullable`,
    infoLost: "Fields are now required but nullable — LLM may output null for optional fields",
  });
}

// ── Recursion ─────────────────────────────────────────────────────────

function recurseFixChildren(node: JsonNode, pointer: string, ctx: FixContext): void {
  if (node["properties"] && typeof node["properties"] === "object") {
    const props = node["properties"] as JsonNode;
    for (const [key, value] of Object.entries(props)) {
      if (value && typeof value === "object") {
        fixWalkNode(value as JsonNode, `${pointer}/properties/${key}`, false, ctx);
      }
    }
  }

  if (node["items"] && typeof node["items"] === "object") {
    fixWalkNode(node["items"] as JsonNode, `${pointer}/items`, false, ctx);
  }

  if (Array.isArray(node["prefixItems"])) {
    (node["prefixItems"] as unknown[]).forEach((item, i) => {
      if (item && typeof item === "object") {
        fixWalkNode(item as JsonNode, `${pointer}/prefixItems/${i}`, false, ctx);
      }
    });
  }

  if (Array.isArray(node["anyOf"])) {
    (node["anyOf"] as unknown[]).forEach((branch, i) => {
      if (branch && typeof branch === "object") {
        fixWalkNode(branch as JsonNode, `${pointer}/anyOf/${i}`, false, ctx);
      }
    });
  }

  if (node["$defs"] && typeof node["$defs"] === "object") {
    const defs = node["$defs"] as JsonNode;
    for (const [key, value] of Object.entries(defs)) {
      if (value && typeof value === "object") {
        fixWalkNode(value as JsonNode, `${pointer}/$defs/${key}`, false, ctx);
      }
    }
  }

  if (node["additionalProperties"] && typeof node["additionalProperties"] === "object") {
    fixWalkNode(
      node["additionalProperties"] as JsonNode,
      `${pointer}/additionalProperties`,
      false,
      ctx,
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

function resolveType(node: JsonNode): string | undefined {
  const t = node["type"];
  if (typeof t === "string") return t;
  if (Array.isArray(t)) {
    const nonNull = t.filter((v) => v !== "null");
    if (nonNull.length === 1 && typeof nonNull[0] === "string") return nonNull[0];
  }
  return undefined;
}

function makeNullable(node: JsonNode): void {
  const t = node["type"];
  if (typeof t === "string" && t !== "null") {
    node["type"] = [t, "null"];
  } else if (Array.isArray(t) && !t.includes("null")) {
    node["type"] = [...t, "null"];
  }
  if (Array.isArray(node["anyOf"]) && !t) {
    const branches = node["anyOf"] as JsonNode[];
    const hasNull = branches.some((b) => b["type"] === "null");
    if (!hasNull) {
      branches.push({ type: "null" });
    }
  }
}

function appendDescription(node: JsonNode, text: string): void {
  const existing = typeof node["description"] === "string" ? node["description"] : "";
  node["description"] = existing ? `${existing} (${text})` : text;
}
