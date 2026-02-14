# Structured Output Schema Samples

Exhaustive suite of JSON Schema samples keyed to `structured_output_groups.json` rules. Used to validate that provider behavior (OpenAI, Anthropic, Gemini) matches the documented claims.

## Single source of truth

- **Rules**: Only `structured_output_groups.json` (in `packages/frontend/src/data/`) defines what each group allows. The validator derives valid/invalid from that file.
- **Group ids**: `openai_strict`, `anthropic_structured`, `gemini_json_schema` (from the JSON).
- **Manifest**: Expected result per group is **computed** by the validator, not hand-written.

## Layout

- **fragments.json** – Reusable schema fragments by id. Samples are fragment + optional variant.
- **rule-matrix.json** – Table: rule_id, fragment_id, variant?, description. One row per (rule, fragment) to emit.
- **manifest.json** – Generated: path, rule_ids, fragment_id, expected per group (from validator).
- **schemas/** – Generated: one `.json` per rule row (path = rule_id / fragment_id).
- **validate.ts** – Load groups JSON, apply machine.validation_rules and keyword checks → valid/invalid per group.
- **generate.ts** – Read rule-matrix + fragments, resolve schema (fragment + variant), run validator, write schemas + manifest.

## How to run

From repo root:

```bash
pnpm --filter @ssv/schema-samples generate
```

Generate reads `packages/frontend/src/data/structured_output_groups.json` (camelCase keys: `groupId`, `machine.rootType`, `machine.validationRules`, etc.), writes `schemas/*.json` and `manifest.json`.

Lint and typecheck:

```bash
pnpm exec turbo run lint typecheck --filter=@ssv/schema-samples
```

## Traceability

- **Rule → file**: Manifest and paths are derived from rule_id + fragment_id.
- **Model relevance**: group_id in manifest maps to `groups[].models` in the groups JSON.
- **What it checks**: Each manifest entry has rule_ids and fragment_id; rule-matrix has the one-line description.
