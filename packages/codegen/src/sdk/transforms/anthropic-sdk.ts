import type { SdkChange, SdkGap, SdkTransformResult } from "../../types";
import {
  addChange,
  appendToDescription,
  deepClone,
  isObjectNode,
  walkAllObjects,
} from "../shared";

const STRIPPED_KEYWORDS = [
  "pattern",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "prefixItems",
  "uniqueItems",
  "title",
] as const;

const SUPPORTED_FORMATS = new Set(["date", "date-time", "uuid", "email"]);

/**
 * Simulates Anthropic SDK's `transform_schema()`.
 *
 * Transforms applied:
 * 1. Strip unsupported keywords and append their values to description
 * 2. Add `additionalProperties: false` on all objects
 * 3. Rewrite `oneOf` → `anyOf`
 * 4. Filter `format` to supported subset
 */
export function simulateAnthropicSdk(
  schema: Record<string, unknown>,
): SdkTransformResult {
  const original = deepClone(schema);
  const transformed = deepClone(schema);
  const changes: SdkChange[] = [];
  const gaps: SdkGap[] = [];

  walkAllObjects(transformed, "", (node, path) => {
    // 1. Strip unsupported keywords → append to description
    const strippedParts: string[] = [];
    for (const kw of STRIPPED_KEYWORDS) {
      if (kw in node) {
        strippedParts.push(`${kw}: ${JSON.stringify(node[kw])}`);
        const before = node[kw];
        delete node[kw];
        addChange(
          changes,
          `${path}/${kw}`,
          "removed",
          `Stripped "${kw}" and appended to description`,
          before,
          undefined,
        );
      }
    }
    if (strippedParts.length > 0) {
      appendToDescription(node, strippedParts.join(", "));
      addChange(
        changes,
        `${path}/description`,
        "modified",
        `Appended stripped constraint info to description`,
      );
    }

    // 2. Add additionalProperties: false on objects
    if (isObjectNode(node) && node["additionalProperties"] !== false) {
      const before = node["additionalProperties"];
      node["additionalProperties"] = false;
      addChange(
        changes,
        `${path}/additionalProperties`,
        before === undefined ? "added" : "modified",
        `Set additionalProperties to false`,
        before,
        false,
      );
    }

    // 3. Rewrite oneOf → anyOf
    if (Array.isArray(node["oneOf"])) {
      node["anyOf"] = node["oneOf"];
      delete node["oneOf"];
      addChange(
        changes,
        `${path}/oneOf`,
        "modified",
        `Rewrote oneOf to anyOf`,
        "oneOf",
        "anyOf",
      );
    }

    // 4. Filter format
    if (typeof node["format"] === "string") {
      const format = node["format"] as string;
      if (!SUPPORTED_FORMATS.has(format)) {
        const before = node["format"];
        appendToDescription(node, `format: ${format}`);
        delete node["format"];
        addChange(
          changes,
          `${path}/format`,
          "removed",
          `Unsupported format "${format}" stripped, appended to description`,
          before,
          undefined,
        );
      }
    }
  });

  // Gaps
  const rootType = transformed["type"];
  if (rootType !== "object") {
    gaps.push({
      rule: "root_type",
      description:
        "Anthropic SDK does not validate that root type is 'object'. Non-object root schemas may fail.",
      willCauseError: true,
    });
  }

  if (Array.isArray(transformed["anyOf"])) {
    gaps.push({
      rule: "root_anyof",
      description:
        "Anthropic SDK does not validate root-level anyOf. Root anyOf is not allowed by Anthropic.",
      willCauseError: true,
    });
  }

  // Check for all-fields-required gap
  checkAllFieldsRequired(transformed, gaps);

  return { sdk: "anthropic-sdk", original, transformed, changes, gaps };
}

function checkAllFieldsRequired(
  schema: Record<string, unknown>,
  gaps: SdkGap[],
): void {
  let hasGap = false;
  walkAllObjects(schema, "", (node) => {
    if (hasGap) return;
    if (node["properties"] && typeof node["properties"] === "object") {
      const propKeys = Object.keys(
        node["properties"] as Record<string, unknown>,
      );
      const required = Array.isArray(node["required"])
        ? (node["required"] as string[])
        : [];
      const missing = propKeys.filter((k) => !required.includes(k));
      if (missing.length > 0) hasGap = true;
    }
  });

  if (hasGap) {
    gaps.push({
      rule: "all_fields_required",
      description:
        "Anthropic SDK does not add missing properties to 'required'. All properties must be listed in 'required' for Anthropic.",
      willCauseError: true,
    });
  }
}
