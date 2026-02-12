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
      try {
        const result = await runProvider(
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
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        modelResults.get(key)?.set(schemaId, { ok: false, error: err });
        console.log("error:", err.slice(0, 60));
      }
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
  await writeCompatibility(derived, corpus, models, costOrder);
  console.log("Wrote devops/compatibility-runner/data/compatibility.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
