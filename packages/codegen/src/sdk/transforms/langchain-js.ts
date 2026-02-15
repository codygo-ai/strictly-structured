import type { SdkChange, SdkGap, SdkTransformResult } from "../../types";
import {
  addChange,
  deepClone,
  isObjectNode,
  walkAllObjects,
} from "../shared";

/**
 * Simulates LangChain.js transforms.
 *
 * Uses standard `zod-to-json-schema` (NOT OpenAI's strict fork).
 * Top-level-only additionalProperties: false.
 *
 * Same nested object gap as LangChain Python.
 * Standard zod-to-json-schema may produce schemas that fail OpenAI strict validation.
 */
export function simulateLangchainJs(
  schema: Record<string, unknown>,
): SdkTransformResult {
  const original = deepClone(schema);
  const transformed = deepClone(schema);
  const changes: SdkChange[] = [];
  const gaps: SdkGap[] = [];

  // Top-level only: additionalProperties: false
  if (isObjectNode(transformed) && transformed["additionalProperties"] !== false) {
    const before = transformed["additionalProperties"];
    transformed["additionalProperties"] = false;
    addChange(
      changes,
      "/additionalProperties",
      before === undefined ? "added" : "modified",
      `Set additionalProperties to false at root only`,
      before,
      false,
    );
  }

  // Gap: nested objects missing additionalProperties: false
  let hasNestedGap = false;
  walkAllObjects(transformed, "", (node, path) => {
    if (path === "") return;
    if (isObjectNode(node) && node["additionalProperties"] !== false) {
      hasNestedGap = true;
    }
  });

  if (hasNestedGap) {
    gaps.push({
      rule: "nested_additionalProperties",
      description:
        "LangChain.js only adds additionalProperties: false at the top level. Nested objects are missing it. This will cause OpenAI strict mode to reject the schema.",
      willCauseError: true,
    });
  }

  // Gap: uses standard zod-to-json-schema, not OpenAI's fork
  gaps.push({
    rule: "standard_zod_to_json_schema",
    description:
      "LangChain.js uses standard zod-to-json-schema, not OpenAI's strict fork. This may produce $ref patterns or keywords that OpenAI strict mode rejects.",
    willCauseError: false,
  });

  // Gap: no Anthropic transform
  gaps.push({
    rule: "anthropic_no_transform",
    description:
      "LangChain.js does NOT call Anthropic's transform_schema(). Unsupported keywords are passed through.",
    willCauseError: true,
  });

  // Gap: all-required not enforced
  let hasOptionalFields = false;
  walkAllObjects(transformed, "", (node) => {
    if (node["properties"] && typeof node["properties"] === "object") {
      const propKeys = Object.keys(
        node["properties"] as Record<string, unknown>,
      );
      const required = Array.isArray(node["required"])
        ? (node["required"] as string[])
        : [];
      if (propKeys.some((k) => !required.includes(k))) {
        hasOptionalFields = true;
      }
    }
  });
  if (hasOptionalFields) {
    gaps.push({
      rule: "all_fields_required",
      description:
        "LangChain.js does not add all properties to 'required'. Optional fields will cause errors for OpenAI strict mode and Anthropic.",
      willCauseError: true,
    });
  }

  // Gap: unsupported keywords
  const passedThrough = [
    "pattern",
    "format",
    "minLength",
    "maxLength",
    "minimum",
    "maximum",
    "multipleOf",
    "minItems",
    "maxItems",
    "uniqueItems",
  ];
  const found = new Set<string>();
  walkAllObjects(transformed, "", (node) => {
    for (const kw of passedThrough) {
      if (kw in node) found.add(kw);
    }
  });
  for (const kw of found) {
    gaps.push({
      rule: `passed_through_${kw}`,
      description: `LangChain.js passes "${kw}" through without modification.`,
      willCauseError: true,
    });
  }

  return { sdk: "langchain-js", original, transformed, changes, gaps };
}
