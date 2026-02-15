import type { SchemaRuleSet } from "./groups";
import type { FixResult } from "./types";

type SchemaNode = Record<string, unknown>;

export function fixSchemaForRuleSet(
  raw: string,
  ruleSet: SchemaRuleSet
): FixResult {
  let schema: SchemaNode;
  try {
    schema = JSON.parse(raw) as SchemaNode;
  } catch {
    return { fixedSchema: raw, appliedFixes: [], remainingIssues: ["Invalid JSON"] };
  }

  const appliedFixes: string[] = [];
  const remainingIssues: string[] = [];

  const supportedComposition = new Set(ruleSet.composition?.supported ?? []);
  const supportedKeywordsByType = new Map(
    ruleSet.supportedTypes.map((st) => [st.type, new Set(st.supportedKeywords)])
  );

  // Fix root type
  const rootType = resolveType(schema);
  const allowedRoots = Array.isArray(ruleSet.rootType) ? ruleSet.rootType : [ruleSet.rootType];
  if (rootType && !allowedRoots.includes(rootType)) {
    schema = {
      type: "object",
      properties: { data: schema },
      required: ["data"],
      additionalProperties: false,
    };
    appliedFixes.push(`Wrapped root "${rootType}" in an object with "data" property`);
  }

  fixNode(schema, "", ruleSet, supportedComposition, supportedKeywordsByType, appliedFixes, remainingIssues);

  return {
    fixedSchema: JSON.stringify(schema, undefined, 2),
    appliedFixes,
    remainingIssues,
  };
}

function fixNode(
  node: SchemaNode,
  path: string,
  ruleSet: SchemaRuleSet,
  supportedComposition: Set<string>,
  supportedKeywordsByType: Map<string, Set<string>>,
  appliedFixes: string[],
  remainingIssues: string[]
): void {
  const nodeType = resolveType(node);

  // Fix additionalProperties
  if (
    (nodeType === "object" || node["properties"] !== undefined) &&
    ruleSet.additionalPropertiesMustBeFalse &&
    node["additionalProperties"] !== false
  ) {
    node["additionalProperties"] = false;
    appliedFixes.push(`Added "additionalProperties": false at ${path || "root"}`);
  }

  // Fix required
  if (
    ruleSet.allFieldsRequired &&
    node["properties"] !== undefined &&
    typeof node["properties"] === "object"
  ) {
    const propKeys = Object.keys(node["properties"] as Record<string, unknown>);
    const required = Array.isArray(node["required"]) ? (node["required"] as string[]) : [];
    const missing = propKeys.filter((k) => !required.includes(k));
    if (missing.length > 0) {
      node["required"] = propKeys;
      appliedFixes.push(`Added missing properties to "required" at ${path || "root"}: ${missing.join(", ")}`);
    }
  }

  // Remove unsupported composition keywords
  for (const kw of ["allOf", "oneOf", "not", "if", "then", "else", "dependentRequired", "dependentSchemas"]) {
    if (kw in node && !supportedComposition.has(kw)) {
      delete node[kw];
      appliedFixes.push(`Removed unsupported "${kw}" at ${path || "root"}`);
    }
  }

  // Remove unsupported per-type keywords and move to description
  if (nodeType) {
    const supported = supportedKeywordsByType.get(nodeType);
    if (supported) {
      const keysToRemove: string[] = [];
      for (const key of Object.keys(node)) {
        if (key === "type" || key === "additionalProperties" || key === "properties" || key === "required" || key === "items" || key === "$defs" || key === "$ref") continue;
        if (supportedComposition.has(key)) continue;
        if (!supported.has(key)) {
          keysToRemove.push(key);
        }
      }
      if (keysToRemove.length > 0) {
        const descParts: string[] = [];
        if (typeof node["description"] === "string") {
          descParts.push(node["description"]);
        }
        for (const key of keysToRemove) {
          descParts.push(`${key}: ${JSON.stringify(node[key])}`);
          delete node[key];
        }
        if (descParts.length > 0) {
          node["description"] = descParts.join(". ");
        }
        appliedFixes.push(`Moved unsupported keywords to description at ${path || "root"}: ${keysToRemove.join(", ")}`);
      }
    }
  }

  // Recurse into children
  if (node["properties"] && typeof node["properties"] === "object") {
    const props = node["properties"] as Record<string, unknown>;
    for (const [key, value] of Object.entries(props)) {
      if (value && typeof value === "object") {
        fixNode(value as SchemaNode, `${path}/properties/${key}`, ruleSet, supportedComposition, supportedKeywordsByType, appliedFixes, remainingIssues);
      }
    }
  }

  if (node["items"] && typeof node["items"] === "object") {
    fixNode(node["items"] as SchemaNode, `${path}/items`, ruleSet, supportedComposition, supportedKeywordsByType, appliedFixes, remainingIssues);
  }

  if (Array.isArray(node["prefixItems"])) {
    (node["prefixItems"] as unknown[]).forEach((item, i) => {
      if (item && typeof item === "object") {
        fixNode(item as SchemaNode, `${path}/prefixItems/${i}`, ruleSet, supportedComposition, supportedKeywordsByType, appliedFixes, remainingIssues);
      }
    });
  }

  if (Array.isArray(node["anyOf"])) {
    (node["anyOf"] as unknown[]).forEach((branch, i) => {
      if (branch && typeof branch === "object") {
        fixNode(branch as SchemaNode, `${path}/anyOf/${i}`, ruleSet, supportedComposition, supportedKeywordsByType, appliedFixes, remainingIssues);
      }
    });
  }

  if (node["$defs"] && typeof node["$defs"] === "object") {
    const defs = node["$defs"] as Record<string, unknown>;
    for (const [key, value] of Object.entries(defs)) {
      if (value && typeof value === "object") {
        fixNode(value as SchemaNode, `${path}/$defs/${key}`, ruleSet, supportedComposition, supportedKeywordsByType, appliedFixes, remainingIssues);
      }
    }
  }

  if (node["additionalProperties"] && typeof node["additionalProperties"] === "object") {
    fixNode(node["additionalProperties"] as SchemaNode, `${path}/additionalProperties`, ruleSet, supportedComposition, supportedKeywordsByType, appliedFixes, remainingIssues);
  }
}

function resolveType(node: SchemaNode): string | null {
  const t = node["type"];
  if (typeof t === "string") return t;
  if (Array.isArray(t)) {
    const nonNull = t.filter((v) => v !== "null");
    if (nonNull.length === 1 && typeof nonNull[0] === "string") return nonNull[0];
  }
  return null;
}
