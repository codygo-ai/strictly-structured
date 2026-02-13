#!/usr/bin/env node
/**
 * Compatibility runner: load test schemas, run each against each model, write compatibility data.
 * Requires env: OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, ANTHROPIC_API_KEY (optional per provider).
 */

import { loadCorpus } from "~/loadCorpus.js";
import { runProvider, type ProviderId } from "~/providers.js";
import { deriveModelResults } from "~/derive.js";
import { writeCompatibility, loadCostOrder } from "~/write.js";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ModelConfig {
  id: string;
  provider: ProviderId;
  model: string;
}

const API_KEYS: Record<ProviderId, string | undefined> = {
  openai: process.env.OPENAI_API_KEY,
  google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
};

const MAX_429_RETRIES = 3;
const INITIAL_429_BACKOFF_MS = 2000;

function isRateLimitError(error: string | undefined): boolean {
  if (!error) return false;
  return error.includes("429") || /rate limit/i.test(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function runProviderWith429Retry(
  provider: ProviderId,
  schema: object,
  model: string,
  apiKey: string
): Promise<{ ok: boolean; error?: string }> {
  type R = Awaited<ReturnType<typeof runProvider>>;
  let last: R | undefined;
  let backoffMs = INITIAL_429_BACKOFF_MS;
  for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
    try {
      last = await runProvider(provider, schema, model, apiKey);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      last = { ok: false, error: err, latencyMs: 0 };
    }
    if (last.ok || !isRateLimitError(last.error)) return last;
    if (attempt < MAX_429_RETRIES) {
      console.log(`  rate limit, retry in ${backoffMs / 1000}s (${attempt + 1}/${MAX_429_RETRIES})`);
      await sleep(backoffMs);
      backoffMs *= 2;
    }
  }
  return last!;
}

async function loadModels(): Promise<ModelConfig[]> {
  const path = join(__dirname, "../config/models.json");
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function main(): Promise<void> {
  const models = await loadModels();
  const corpus = await loadCorpus();
  const schemaMap = new Map(corpus.map((s) => [s.id, s]));

  console.log(`Loaded ${corpus.length} schemas, ${models.length} models`);

  type SchemaRunResult = { ok: boolean; error?: string };
  const modelResults = new Map<string, Map<string, SchemaRunResult>>();
  for (const m of models) {
    modelResults.set(m.id, new Map());
  }

  for (const { id: schemaId, schema } of corpus) {
    for (const modelConfig of models) {
      const key = modelConfig.id;
      const apiKey = API_KEYS[modelConfig.provider];
      if (!apiKey) {
        console.warn(`Skipping ${key}: no API key`);
        modelResults.get(key)?.set(schemaId, { ok: false, error: "No API key" });
        continue;
      }
      process.stdout.write(`  ${schemaId} × ${key} ... `);
      const result = await runProviderWith429Retry(
        modelConfig.provider,
        schema,
        modelConfig.model,
        apiKey
      );
      modelResults.get(key)?.set(schemaId, {
        ok: result.ok,
        error: result.error,
      });
      console.log(result.ok ? "OK" : result.error?.slice(0, 60) ?? "fail");
    }
  }

  const derived: Record<string, ReturnType<typeof deriveModelResults>> = {};
  for (const m of models) {
    const results = modelResults.get(m.id)!;
    derived[m.id] = deriveModelResults(
      corpus.map((s) => s.id),
      results,
      schemaMap
    );
  }

  const costOrder = await loadCostOrder();
  const written = await writeCompatibility(derived, corpus, models, costOrder);
  if (!written) {
    console.log("Skipped writing (no API keys). Existing file unchanged.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
