# schemas

Canonical `schema_rule_sets.json` and CLI to generate artifacts for consumers. Consumers pass the output path via argument; no hardcoded targets.

**Vocabulary:** In this repo, **schema** = a JSON Schema that describes data (what users edit and we validate). **Meta-schema** = a JSON Schema that validates other schemas (e.g. `draft-07-meta-schema.json` and the generated files under `rule-set-meta-schemas/`). **Metadata** = the top-level `meta` object in the data (version, lastUpdated, etc.). See [docs/VOCABULARY.md](../../docs/VOCABULARY.md) for the full definitions.

## Data

- **data/schema_rule_sets.json** – Single source of truth for rule set data (display, machine, and dataset **metadata** in the top-level `meta` key).

## CLI

From repo root:

```bash
pnpm --filter @ssv/schemas run generate -- --out-dir <path>
```

Or use `--to` as an alias for `--out-dir`. **The output path is required.**

Writes under the given path:

- **data/schema_rule_sets.generated.json** – Copy of the canonical rule sets data.
- **types/schemaRuleSets.generated.ts** – TypeScript types for that data.
- **data/rule-set-meta-schemas/** – One **meta-schema** per rule set (e.g. `gpt-4-o1.generated.json`). Each file is a draft-07 meta-schema (a schema that validates other schemas). Use its path or URL when configuring Monaco or another validator for the selected rule set. Generation uses the full rule set; if required data is missing, the CLI errors.

Example (frontend):

```bash
pnpm run generate:groups
```

which runs generate with `--out-dir packages/frontend/src`.

## Schema samples

Under **samples/**:

- **fragments.json**, **rule-matrix.json** – Inputs for sample generation.
- **schemas/** – Generated sample JSON schemas (from rule-matrix + fragments).
- **manifest.json** – Generated manifest (expected valid/invalid per rule set).

Regenerate samples (writes under `samples/`):

```bash
pnpm --filter @ssv/schemas run generate:samples
```

## Rule-set meta-schemas

The generator writes **one meta-schema per rule set** under `data/rule-set-meta-schemas/`. Each file (e.g. `gpt-4-o1.generated.json`) is a standalone draft-07 **meta-schema** (a schema that validates schemas). Reference it by path or URL when assigning a meta-schema to Monaco for the selected rule set. Generation uses the full rule set; if required data is missing, generation errors; there is no fallback.

## Exports

- **@ssv/schemas/compat-types** – Legacy types for compatibility-runner (`CompatibilityGroup`, `KeywordRule`, `ModelResult`).
