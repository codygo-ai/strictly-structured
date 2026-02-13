import type {
  CompatibilityData,
  CompatibilityGroup,
  KeywordRule,
} from "./types.js";
import { JSON_SCHEMA_KEYWORDS } from "./types.js";
import { getSupportedKeywordsForModel } from "./keywords.js";

const KNOWN_KEYWORDS = new Set<string>(JSON_SCHEMA_KEYWORDS);
/** Keywords we validate and may have rules for (e.g. nullable) but not in JSON Schema core list. */
const EXTRA_KEYWORDS = new Set<string>(["nullable"]);
const KEYWORDS_TO_CHECK = new Set([...KNOWN_KEYWORDS, ...EXTRA_KEYWORDS]);

/** Get the group whose representative or modelIds includes modelId. */
function getGroupForModel(
  data: CompatibilityData,
  modelId: string
): CompatibilityGroup | undefined {
  return data.groups?.find(
    (g) => g.representative === modelId || g.modelIds.includes(modelId)
  );
}

/** Get keyword rule for a group (by representative id). Single source of truth for display text. */
export function getKeywordRule(
  data: CompatibilityData,
  groupRepresentativeId: string,
  keyword: string
): KeywordRule | undefined {
  const group = data.groups?.find(
    (g) =>
      g.representative === groupRepresentativeId ||
      g.modelIds.includes(groupRepresentativeId)
  );
  return group?.keywordRules?.[keyword];
}

/** Resolve "allowed" for a keyword: rule override or compatibility (supported_keywords). */
function isKeywordAllowed(
  group: CompatibilityGroup | undefined,
  keyword: string,
  supportedSet: Set<string>
): boolean {
  const rule = group?.keywordRules?.[keyword];
  if (rule?.allowed !== undefined) return rule.allowed;
  return supportedSet.has(keyword);
}

export interface ValidationIssue {
  path: string;
  keyword: string;
  message: string;
  /** Fix suggestion from single-source keyword rule, when present. */
  suggestion?: string;
  severity?: "error" | "warning" | "info";
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
 * Path (dot + brackets) to JSON pointer for source map lookups.
 * e.g. "properties.name.type" -> "/properties/name/type", "items[0]" -> "/items/0"
 */
export function pathToJsonPointer(path: string): string {
  if (!path) return "";
  const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  return "/" + segments.join("/");
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
    if (KNOWN_KEYWORDS.has(keyword) && !supported.has(keyword)) {
      issues.push({
        path,
        keyword,
        message: `Keyword "${keyword}" may not be supported by ${modelId}. Check Model support.`,
      });
    }
  }
  return issues;
}

/** Neutral user-facing message when no rule text in single source. */
const SELECTION_ISSUE_MESSAGE =
  "May not be supported for your selected models. Change the schema or change which models are selected.";

/**
 * Allowed set for selection: keyword allowed iff allowed for every selected model.
 * Uses rule.allowed override when present, else compatibility (supported_keywords).
 */
function getAllowedKeywordsForSelection(
  modelIds: string[],
  data: CompatibilityData
): Set<string> | null {
  let allowed: Set<string> | null = null;
  for (const modelId of modelIds) {
    const supported = getSupportedKeywordsForModel(modelId, data);
    if (supported.size === 0) continue; // no data for this model: skip for LCD
    const group = getGroupForModel(data, modelId);
    const modelAllowed = new Set<string>();
    for (const kw of KEYWORDS_TO_CHECK) {
      if (isKeywordAllowed(group, kw, supported)) modelAllowed.add(kw);
    }
    if (allowed === null) allowed = new Set(modelAllowed);
    else {
      const next = new Set<string>();
      for (const k of allowed) if (modelAllowed.has(k)) next.add(k);
      allowed = next;
    }
  }
  return allowed;
}

/**
 * Returns validation issues for the current selection: keywords in the schema
 * that are not allowed for the selection (LCD + rule overrides like nullable).
 * Message, suggestion, severity from single-source keyword rules when present.
 */
export function getValidationIssuesForSelection(
  schema: object,
  modelIds: string[],
  data: CompatibilityData
): ValidationIssue[] {
  const allowed = getAllowedKeywordsForSelection(modelIds, data);
  if (!allowed || allowed.size === 0) return [];

  const pairs: Array<{ keyword: string; path: string }> = [];
  collectKeywords(schema, "", pairs);

  const issues: ValidationIssue[] = [];
  for (const { keyword, path } of pairs) {
    if (!KEYWORDS_TO_CHECK.has(keyword) || allowed.has(keyword)) continue;
    const firstRepresentative = modelIds[0];
    const rule = firstRepresentative
      ? getKeywordRule(data, firstRepresentative, keyword)
      : undefined;
    issues.push({
      path,
      keyword,
      message: rule?.errorMessage ?? SELECTION_ISSUE_MESSAGE,
      suggestion: rule?.suggestion,
      severity: rule?.severity ?? "error",
    });
  }
  return issues;
}
