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

/** Errors we do not record in compatibility data (no API key, rate limit, etc.). */
export function isTechnicalError(error: string | undefined): boolean {
  if (!error) return true;
  if (error === "No API key") return true;
  if (error.includes("429") || /rate limit/i.test(error)) return true;
  return false;
}

/**
 * Derive per-model supported schema ids and supported keywords from raw results.
 * Technical errors (no API key, 429) are ignored — not recorded in supported or failed.
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
      const err = result?.error ?? "failed";
      if (!isTechnicalError(err)) {
        failed[id] = err;
      }
    }
  }

  const supported_keywords = Array.from(keywordPassed.keys()).sort();
  return { supported, failed, supported_keywords };
}
