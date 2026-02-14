import { parseSchema } from "./schemas.js";
import { validateWithOpenAI } from "./providers/openai.js";
import { validateWithGoogle } from "./providers/google.js";
import { validateWithAnthropic } from "./providers/anthropic.js";
import type { ProviderId } from "./types.js";
import { MODEL_MAP } from "./model-map.js";

export type ValidateBody = {
  schema?: string;
  providers?: string[];
  modelIds?: string[];
};

type ValidateFn = (
  schema: object,
  apiKey: string,
  model?: string
) => Promise<{ provider: string; model: string; ok: boolean; latencyMs: number; error?: string }>;

const RUNNERS: Record<ProviderId, ValidateFn> = {
  openai: validateWithOpenAI,
  google: validateWithGoogle,
  anthropic: validateWithAnthropic,
};

function getApiKeysFromEnv(): Record<ProviderId, string | undefined> {
  return {
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };
}

export async function runValidate(
  body: ValidateBody,
  apiKeys?: Record<ProviderId, string | undefined>
): Promise<{ results: Array<{ provider: string; model: string; ok: boolean; latencyMs: number; error?: string }> } | { error: string }> {
  const { schema: raw, providers: providerIds, modelIds } = body;
  if (typeof raw !== "string") {
    return { error: "Missing or invalid 'schema' (string)" };
  }

  const parsed = parseSchema(raw);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const schema = parsed.schema;

  const API_KEYS = apiKeys ?? getApiKeysFromEnv();
  const targets: Array<{ provider: ProviderId; model?: string }> = [];
  if (Array.isArray(modelIds) && modelIds.length > 0) {
    for (const id of modelIds) {
      const entry = typeof id === "string" ? MODEL_MAP[id] : undefined;
      if (entry) targets.push({ provider: entry.provider, model: entry.model });
    }
  }
  if (targets.length === 0) {
    const providers: ProviderId[] = Array.isArray(providerIds)
      ? (providerIds.filter((p): p is ProviderId =>
          ["openai", "google", "anthropic"].includes(p)
        ))
      : ["openai", "google", "anthropic"];
    for (const id of providers) {
      targets.push({ provider: id });
    }
  }

  const results = await Promise.all(
    targets.map(async (t) => {
      const key = API_KEYS[t.provider];
      if (!key) {
        return {
          provider: t.provider,
          model: t.model ?? "-",
          ok: false,
          latencyMs: 0,
          error: "API key not configured",
        };
      }
      return RUNNERS[t.provider](schema, key, t.model);
    })
  );

  return { results };
}
