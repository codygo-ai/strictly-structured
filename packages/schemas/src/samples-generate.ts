/**
 * Reads rule-matrix + fragments, validates per group from local data, writes schemas/*.json and manifest.json.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { validateSchemaForRuleSet, getRuleSetIds, type RuleSetsData } from './validate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const RULE_SETS_PATH = path.join(PACKAGE_ROOT, 'data', 'schema_rule_sets.json');
const SAMPLES_DIR = path.join(PACKAGE_ROOT, 'samples');
const FRAGMENTS_PATH = path.join(SAMPLES_DIR, 'fragments.json');
const RULE_MATRIX_PATH = path.join(SAMPLES_DIR, 'rule-matrix.json');
const SCHEMAS_DIR = path.join(SAMPLES_DIR, 'schemas');
const MANIFEST_PATH = path.join(SAMPLES_DIR, 'manifest.json');

interface RuleRow {
  rule_id: string;
  fragment_id: string;
  variant?: Record<string, unknown>;
  description: string;
}

interface RuleMatrix {
  version: string;
  source_ruleSets: string;
  rows: RuleRow[];
}

interface ManifestEntry {
  path: string;
  rule_ids: string[];
  fragment_id: string;
  description: string;
  expected: Record<string, 'valid' | 'invalid'>;
}

function loadJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function resolveSchema(
  fragment: Record<string, unknown>,
  variant?: Record<string, unknown>,
): Record<string, unknown> {
  if (!variant || Object.keys(variant).length === 0) return { ...fragment };
  return deepMerge({ ...fragment }, variant);
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const s = source[key];
    const t = target[key];
    if (
      s !== null &&
      typeof s === 'object' &&
      !Array.isArray(s) &&
      t !== null &&
      typeof t === 'object' &&
      !Array.isArray(t)
    ) {
      target[key] = deepMerge(t as Record<string, unknown>, s as Record<string, unknown>);
    } else {
      target[key] = s;
    }
  }
  return target;
}

function pathFor(fragmentId: string, variant?: Record<string, unknown>): string {
  const suffix = variant && Object.keys(variant).length > 0 ? '_variant' : '';
  return `schemas/${fragmentId}${suffix}.json`;
}

function main(): void {
  const ruleSetsData = loadJson<RuleSetsData>(RULE_SETS_PATH);
  const ruleSetIds = getRuleSetIds(ruleSetsData);
  const fragments = loadJson<Record<string, Record<string, unknown>>>(FRAGMENTS_PATH);
  const matrix = loadJson<RuleMatrix>(RULE_MATRIX_PATH);

  if (!fs.existsSync(SCHEMAS_DIR)) {
    fs.mkdirSync(SCHEMAS_DIR, { recursive: true });
  }

  const manifest: ManifestEntry[] = [];
  const written = new Set<string>();

  for (const row of matrix.rows) {
    const fragment = fragments[row.fragment_id];
    if (!fragment) {
      console.warn(`Unknown fragment_id: ${row.fragment_id}`);
      continue;
    }
    const schema = resolveSchema(fragment, row.variant);
    const relPath = pathFor(row.fragment_id, row.variant);
    const expected: Record<string, 'valid' | 'invalid'> = {};
    for (const rid of ruleSetIds) {
      const result = validateSchemaForRuleSet(schema, rid, ruleSetsData);
      expected[rid] = result.valid ? 'valid' : 'invalid';
    }

    if (!written.has(relPath)) {
      const absPath = path.join(SCHEMAS_DIR, path.basename(relPath));
      const dir = path.dirname(absPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(absPath, JSON.stringify(schema, null, 2) + '\n', 'utf-8');
      written.add(relPath);
    }

    manifest.push({
      path: relPath,
      rule_ids: [row.rule_id],
      fragment_id: row.fragment_id,
      description: row.description,
      expected,
    });
  }

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        version: '1.0',
        source_ruleSets: matrix.source_ruleSets,
        ruleSetIds: ruleSetIds,
        generated_at: new Date().toISOString(),
        samples: manifest,
      },
      null,
      2,
    ) + '\n',
    'utf-8',
  );

  console.log(`Wrote ${written.size} schema(s) to ${SCHEMAS_DIR}`);
  console.log(`Wrote manifest (${manifest.length} entries) to ${MANIFEST_PATH}`);
}

main();
