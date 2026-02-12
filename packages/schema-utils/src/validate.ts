import type { CompatibilityData } from "./types.js";
import { getSupportedKeywordsForModel } from "./keywords.js";

export interface ValidationIssue {
  path: string;
  keyword: string;
  message: string;
}

/** Collect (keyword, path) pairs from a schema tree. */
function collectKeywords(
  obj: unknown,
  path: string,
  pairs: Array<{ keyword: string; path: string }>
): void {
  if (obj === null || typeof obj !== "object") return;
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key.startsWith("_")) continue;
    const fullPath = path ? `${path}.${key}` : key;
    pairs.push({ keyword: key, path: fullPath });
    const value = record[key];
    if (value !== null && typeof value === "object") {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          collectKeywords(value[i], `${fullPath}[${i}]`, pairs);
        }
      } else {
        collectKeywords(value, fullPath, pairs);
      }
    }
  }
}

/**
 * Walk schema and collect every keyword (key) used. Then check each against
 * the model's supported set. Returns list of issues (unsupported keywords).
 * If supported set is empty (e.g. unknown model), returns no issues (allow all).
 */
export function validateSchemaForModel(
  schema: object,
  modelId: string,
  data: CompatibilityData
): ValidationIssue[] {
  const supported = getSupportedKeywordsForModel(modelId, data);
  if (supported.size === 0) return [];

  const pairs: Array<{ keyword: string; path: string }> = [];
  collectKeywords(schema, "", pairs);

  const issues: ValidationIssue[] = [];
  for (const { keyword, path } of pairs) {
    if (!supported.has(keyword)) {
      issues.push({
        path,
        keyword,
        message: `Keyword "${keyword}" may not be supported by ${modelId}. Check Model support.`,
      });
    }
  }
  return issues;
}
