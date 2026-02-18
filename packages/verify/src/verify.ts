import fs from 'node:fs';
import path from 'node:path';

import { validateWithAnthropic } from '@ssv/providers/anthropic';
import { validateWithGoogle } from '@ssv/providers/google';
import { validateWithOpenAI } from '@ssv/providers/openai';
import type { ProviderResult } from '@ssv/providers/types';
import ruleSetsDataJson from '@ssv/schemas/data/schemaRuleSets.json' with { type: 'json' };
import { RULESET_TO_CHEAPEST_MODEL } from '@ssv/schemas/models';
import { fixSchemaForRuleSet } from '@ssv/schemas/ruleSetFixer';
import { validateSchemaForRuleSet } from '@ssv/schemas/ruleSetValidator';
import type { SchemaRuleSet, SchemaRuleSetsData, RuleSetId } from '@ssv/schemas/types';
import { RULE_SET_IDS } from '@ssv/schemas/types';

import { validateStructural } from './structural';
import type {
  DocumentReport,
  FixOutcome,
  LlmTestOutcome,
  RuleSetReport,
  ValidationOutcome,
  VerifyOptions,
  VerifyReport,
} from './types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_GENERATIVE_AI_API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

const ruleSetsData = ruleSetsDataJson as unknown as SchemaRuleSetsData;
const RULE_SETS = ruleSetsData.ruleSets;

export function collectSchemaFiles(inputPath: string): string[] {
  const stat = fs.statSync(inputPath);
  if (stat.isFile()) return [inputPath];

  const files: string[] = [];
  for (const entry of fs.readdirSync(inputPath, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(path.join(entry.parentPath, entry.name));
    }
  }
  return files.sort();
}

function parseSchemaFile(filePath: string): { schema: Record<string, unknown>; raw: string } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(content) as Record<string, unknown>;

  const { _meta: _, ...schema } = parsed;
  const raw = JSON.stringify(schema, null, 2);
  return { schema, raw };
}

function runValidation(raw: string, ruleSet: SchemaRuleSet): ValidationOutcome {
  const markers = validateSchemaForRuleSet(raw, ruleSet);
  const errors = markers.filter((m) => m.severity === 'error');
  const warnings = markers.filter((m) => m.severity === 'warning');
  return { valid: errors.length === 0, errors, warnings };
}

function skippedLlmResult(ruleSetId: RuleSetId): LlmTestOutcome {
  return {
    model: RULESET_TO_CHEAPEST_MODEL[ruleSetId],
    valid: false,
    skipped: true,
    latencyMs: 0,
  };
}

function requireApiKey(provider: string): string {
  switch (provider) {
    case 'openai':
      if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY env var is required for LLM testing');
      return OPENAI_API_KEY;
    case 'anthropic':
      if (!ANTHROPIC_API_KEY)
        throw new Error('ANTHROPIC_API_KEY env var is required for LLM testing');
      return ANTHROPIC_API_KEY;
    case 'google':
      if (!GOOGLE_GENERATIVE_AI_API_KEY)
        throw new Error(
          'GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY env var is required for LLM testing',
        );
      return GOOGLE_GENERATIVE_AI_API_KEY;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function runLlmTest(
  schema: Record<string, unknown>,
  ruleSetId: RuleSetId,
): Promise<LlmTestOutcome> {
  const modelId = RULESET_TO_CHEAPEST_MODEL[ruleSetId];
  const colonIdx = modelId.indexOf(':');
  const providerPrefix = modelId.slice(0, colonIdx);
  const model = modelId.slice(colonIdx + 1);
  const apiKey = requireApiKey(providerPrefix);

  let result: ProviderResult;
  switch (providerPrefix) {
    case 'openai':
      result = await validateWithOpenAI(schema, apiKey, model);
      break;
    case 'anthropic':
      result = await validateWithAnthropic(schema, apiKey, model);
      break;
    case 'google':
      result = await validateWithGoogle(schema, apiKey, model);
      break;
    default:
      throw new Error(`Unknown provider prefix: ${providerPrefix}`);
  }

  return { model: modelId, valid: result.ok, error: result.error, latencyMs: result.latencyMs };
}

async function verifyDocument(
  filePath: string,
  ruleSetIds: RuleSetId[],
  opts: VerifyOptions,
): Promise<DocumentReport> {
  const { schema, raw } = parseSchemaFile(filePath);

  const structural = validateStructural(schema);

  const ruleSetResults: RuleSetReport[] = [];

  for (const ruleSetId of ruleSetIds) {
    const ruleSet = RULE_SETS.find((r) => r.ruleSetId === ruleSetId);
    if (!ruleSet) throw new Error(`Unknown ruleSetId: ${ruleSetId}`);

    const validation = runValidation(raw, ruleSet);

    const llmTest = opts.skipLlm
      ? skippedLlmResult(ruleSetId)
      : await runLlmTest(schema, ruleSetId);

    let fix: FixOutcome | undefined;
    if (!validation.valid && !opts.skipLlm && !llmTest.valid && !opts.skipFix) {
      const fixResult = fixSchemaForRuleSet(schema, ruleSet);
      const fixedRaw = JSON.stringify(fixResult.fixedSchema, null, 2);

      const postFixValidation = runValidation(fixedRaw, ruleSet);
      const postFixLlmTest = await runLlmTest(
        fixResult.fixedSchema as Record<string, unknown>,
        ruleSetId,
      );

      fix = {
        appliedFixes: fixResult.appliedFixes,
        unresolvedErrors: fixResult.unresolvedErrors,
        postFixValidation,
        postFixLlmTest,
        fixedSchema: fixResult.fixedSchema as Record<string, unknown>,
      };
    }

    ruleSetResults.push({ ruleSetId, validation, llmTest, fix });
  }

  return { path: filePath, structural, ruleSetResults };
}

function buildSummary(documents: DocumentReport[]): VerifyReport['summary'] {
  let totalTests = 0;
  let passedBoth = 0;
  let failedValidationOnly = 0;
  let failedLlmOnly = 0;
  let failedBoth = 0;
  let llmSkipped = 0;
  let fixAttempted = 0;
  let fixSucceeded = 0;

  for (const doc of documents) {
    for (const rs of doc.ruleSetResults) {
      totalTests++;

      if (rs.llmTest.skipped) {
        llmSkipped++;
        if (!rs.validation.valid) failedValidationOnly++;
        else passedBoth++;
        continue;
      }

      const vFail = !rs.validation.valid;
      const lFail = !rs.llmTest.valid;

      if (!vFail && !lFail) passedBoth++;
      else if (vFail && !lFail) failedValidationOnly++;
      else if (!vFail && lFail) failedLlmOnly++;
      else failedBoth++;

      if (rs.fix) {
        fixAttempted++;
        if (rs.fix.postFixValidation.valid && rs.fix.postFixLlmTest.valid) fixSucceeded++;
      }
    }
  }

  return {
    totalDocuments: documents.length,
    totalTests,
    passedBoth,
    failedValidationOnly,
    failedLlmOnly,
    failedBoth,
    llmSkipped,
    fixAttempted,
    fixSucceeded,
  };
}

export async function runVerify(
  inputPaths: string[],
  opts: VerifyOptions = {},
): Promise<VerifyReport> {
  const ruleSetIds = opts.ruleSetIds ?? [...RULE_SET_IDS];

  const files = inputPaths.flatMap(collectSchemaFiles);
  if (files.length === 0) throw new Error('No JSON schema files found');

  console.log(
    `Found ${files.length} schema file(s), testing against ${ruleSetIds.length} ruleSet(s)\n`,
  );

  const documents: DocumentReport[] = [];

  for (const file of files) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`  Verifying: ${relPath}`);
    const report = await verifyDocument(file, ruleSetIds, opts);
    documents.push(report);
  }

  const summary = buildSummary(documents);

  return {
    meta: {
      timestamp: new Date().toISOString(),
      documentsCount: documents.length,
      ruleSetIds,
    },
    documents,
    summary,
  };
}
