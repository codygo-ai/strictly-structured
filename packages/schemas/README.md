# schemas

Canonical `structured_output_groups.json` and CLI to generate artifacts for consumers. Consumers pass the output path via argument; no hardcoded targets.

## Data

- **data/structured_output_groups.json** – Single source of truth for group rules (display, machine, meta).

## CLI

From repo root:

```bash
pnpm --filter @ssv/schemas run generate -- --out-dir <path>
```

Or use `--to` as an alias for `--out-dir`. **The output path is required.**

Writes under the given path:

- **data/structured_output_groups.generated.json** – Copy of the canonical groups data.
- **types/structuredOutputGroups.generated.ts** – TypeScript types for that data.
- **data/provider-meta-schemas.generated.json** – JSON Schema (draft-07) meta-schemas keyed by groupId. Each meta-schema describes the allowed subset of JSON Schema for that provider. Intended for consumers (e.g. Monaco editor) to validate and autocomplete user schemas against the allowed subset per group. Generation uses the full group (display + machine, etc.); if required data (e.g. machine) is missing, the CLI errors.

Example (frontend):

```bash
pnpm run generate:groups
```

which runs generate with `--out-dir packages/frontend/src`.

## Schema samples

Under **samples/**:

- **fragments.json**, **rule-matrix.json** – Inputs for sample generation.
- **schemas/** – Generated sample JSON schemas (from rule-matrix + fragments).
- **manifest.json** – Generated manifest (expected valid/invalid per group).

Regenerate samples (writes under `samples/`):

```bash
pnpm --filter @ssv/schemas run generate:samples
```

## Provider meta-schemas

The generator produces one draft-07 JSON Schema per group. Each meta-schema restricts the allowed keywords and structure for user schemas targeting that provider (e.g. root type, per-type keywords, composition). Generation uses the **full group** (display, machine, and any other fields that are useful). If required data (e.g. `machine`) is missing on a group, generation **errors**; there is no fallback.

## Exports

- **@ssv/schemas/compat-types** – Legacy types for compatibility-runner (`CompatibilityGroup`, `KeywordRule`, `ModelResult`).
