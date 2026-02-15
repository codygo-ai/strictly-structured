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
- **data/group-meta-schemas/** – One valid draft-07 JSON Schema file per group (e.g. `gpt-4-o1.generated.json`, `claude-4-5.generated.json`). Each file is a standalone, referenceable meta-schema. Use its path or URL when configuring Monaco (or any validator) for the selected group. Generation uses the full group (display + machine, etc.); if required data (e.g. machine) is missing, the CLI errors.

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

## Group meta-schemas

The generator writes **one valid, referenceable JSON Schema file per group** under `data/group-meta-schemas/`. Each file (e.g. `gpt-4-o1.generated.json`) is a standalone draft-07 meta-schema: valid JSON Schema, no wrapper object. Reference it by path or URL when assigning a schema to Monaco for the selected group. Generation uses the **full group** (display, machine, and any other fields that are useful). If required data (e.g. `machine`) is missing on a group, generation **errors**; there is no fallback.

## Exports

- **@ssv/schemas/compat-types** – Legacy types for compatibility-runner (`CompatibilityGroup`, `KeywordRule`, `ModelResult`).
