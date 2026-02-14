---
name: Schema-groups-tools single package
overview: Single package schema-groups-tools (data + CLI) owns canonical data and generates artifacts; consumers pass the output path via CLI argument; frontend/backend use only generated .generated.* files. No schema-utils.
todos: []
isProject: false
---

# Single schema-groups-tools: data + tools, generated artifacts only

## Goals

1. **One package: schema-groups-tools** – Holds both the canonical **data** (`structured_output_groups.json`) and **tools** (CLI). Used as a CLI; consumers do not import from it at runtime.
2. **Consumers pass output path via argument** – The CLI does not hardcode or infer where to write. Each consumer (frontend, backend, etc.) invokes the tool with an argument that specifies **where** to generate (e.g. `--out-dir packages/frontend/src/data` or `--to ./src/generated`). The tools write all generated artifacts (`.generated.*` files) under that path.
3. **Generated artifacts as first-class code** – Outputs are copied as `.generated.*` under the path the consumer provided. Consumers own and use those files like normal source.
4. **No schema-utils** – Frontend and backend use only their own code and the generated artifacts. Remove or stop using `@ssv/schema-utils`.
5. **No runtime sharing for now** – Frontend and backend have everything they need inside their package (generated files + their code). No dependency on schema-groups-tools at runtime.

---

## 1. Package: schema-groups-tools

**Location**: [devops/schema-groups-tools](devops/schema-groups-tools)  
**Name**: `@ssv/schema-groups-tools`

**Contains**:

- **Data**: Canonical `structured_output_groups.json` (moved from frontend), e.g. `data/structured_output_groups.json`.
- **CLI**: A `generate` command that:
  - Accepts a **required argument** for where to write (e.g. `--out-dir <path>` or `--to <path>`). **Consumers tell the tools where to generate; the tools do not assume target packages or paths.**
  - Reads the canonical JSON and group definitions.
  - Produces the chosen formats (groups JSON, TypeScript types, provider meta-schemas, etc.) and writes them as `.generated.*` files **under the given path**.
- **Schema samples suite**: Current schema-samples content (schemas/, fragments, rule-matrix, validate, generate for samples, manifest). Sample generation can also accept an optional output path via argument if samples are to be written into a consumer.
- **Provider meta-schema generation**: Produces a JSON Schema (draft-07 subset) per group; written under the consumer-provided path when requested.

**CLI contract**:

- Example: `pnpm --filter @ssv/schema-groups-tools generate --out-dir packages/frontend/src/data`
- Or: `pnpm exec schema-groups-tools generate --to ./src/generated`
- **No default or hardcoded target.** The `--out-dir` / `--to` (or equivalent) argument is required (or the CLI exits with usage). Optional flags may select formats (e.g. `--format types`, `--format provider-meta-schemas`); if omitted, generate all applicable artifacts. All outputs use the `.generated.*` naming convention under the given directory.

---

## 2. What gets generated and where

**Where**: Entirely determined by the path the consumer passes. Example: if the consumer runs `generate --out-dir packages/frontend/src/data`, then artifacts appear under `packages/frontend/src/data/` (e.g. `structured_output_groups.generated.json`, `structuredOutputGroups.generated.ts` if types are emitted there, or a subdir). The consumer may pass a path like `packages/frontend/src` and the tools may write into `data/` and `types/` subdirs under it, or the consumer passes the exact base path they want and the CLI documents the exact filenames it writes.

| Artifact              | Naming                                                            | Written under consumer-provided path    |
| --------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| Groups data           | `structured_output_groups.generated.json`                         | e.g. `{out-dir}/` or `{out-dir}/data/`  |
| Groups types          | `structuredOutputGroups.generated.ts`                             | e.g. `{out-dir}/` or `{out-dir}/types/` |
| Provider meta-schemas | e.g. `provider-meta-schemas.generated.json` or one file per group | `{out-dir}/`                            |

Frontend and backend **do not** depend on `@ssv/schema-groups-tools` at runtime. They run the CLI (e.g. in a script or CI) with their chosen path and then use only the generated files in their package.

---

## 3. Frontend and backend: generated-only, no schema-utils

**Frontend**:

- No dependency on schema-utils or schema-groups-tools at runtime.
- A script or docs instruct: run schema-groups-tools with e.g. `--out-dir packages/frontend/src` (or a path that yields `src/data/` and `src/types/` as desired).
- Imports use the generated files (e.g. `~/data/structured_output_groups.generated.json`, `~/types/structuredOutputGroups.generated.ts`). Any validation or editor logic stays in frontend.

**Backend**:

- Same idea: invoke CLI with backend’s chosen path; use only the generated artifacts and backend’s own code.

**No more schema-utils**:

- Remove or deprecate [packages/schema-utils](packages/schema-utils). [devops/compatibility-runner](devops/compatibility-runner) migrates to schema-groups-tools for types (or gets a generated types file by running the CLI with its own `--out-dir`).

---

## 4. Migration steps (order)

1. **Create devops/schema-groups-tools** with data, CLI (with **required** `--out-dir`/`--to`), schema samples, and provider meta-schema generator. CLI must require the output path and document the exact filenames it writes under that path.
2. **Frontend**: Add a script that runs the CLI with e.g. `--out-dir packages/frontend/src` (or the path that matches frontend layout). Switch imports to generated files; remove old groups JSON. No runtime dependency on schema-groups-tools.
3. **Backend**: If needed, run CLI with backend’s path; use only generated files.
4. **Compatibility-runner**: Switch from schema-utils to schema-groups-tools (or run CLI with compatibility-runner’s path for generated types).
5. **Remove schema-utils** and root schema-samples; update pnpm-workspace.
6. **Docs**: README in schema-groups-tools states that consumers must pass the output path via argument; list generated filenames and formats.

---

## 5. Summary

- **Single package**: schema-groups-tools = data + CLI + schema samples + provider meta-schema generation.
- **Output location**: Consumers tell the tools where to generate via a CLI argument (e.g. `--out-dir`, `--to`). No hardcoded target paths.
- **Consumers**: Use only generated `.generated.*` files under the path they specified; no runtime sharing, no schema-utils.
- **Frontend/backend**: Run the CLI with their chosen path; use only internal code + generated artifacts.
