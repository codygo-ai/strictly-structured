import type { CorpusSchema } from "~/loadCorpus.js";

export interface SchemaRunResult {
  ok: boolean;
  error?: string;
}

export interface ModelResult {
  supported: string[];
  failed: Record<string, string>;
  supported_keywords: string[];
}

/**
 * Derive per-model supported schema ids and supported keywords from raw results.
 * A keyword is considered supported for a model if at least one schema that
 * has that keyword in its features passed for that model.
 */
export function deriveModelResults(
  schemaIds: string[],
  results: Map<string, SchemaRunResult>,
  schemas: Map<string, CorpusSchema>
): ModelResult {
  const supported: string[] = [];
  const failed: Record<string, string> = {};
  const keywordPassed = new Map<string, boolean>();

  for (const id of schemaIds) {
    const result = results.get(id);
    const ok = result?.ok ?? false;
    const meta = schemas.get(id);
    const features = meta?.features ?? [];

    if (ok) {
      supported.push(id);
      for (const f of features) {
        keywordPassed.set(f, true);
      }
    } else {
      failed[id] = result?.error ?? "failed";
    }
  }

  const supported_keywords = Array.from(keywordPassed.keys()).sort();
  return { supported, failed, supported_keywords };
}
