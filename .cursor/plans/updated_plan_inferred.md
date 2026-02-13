# Structured Schema Validator – Updated Plan (Inferred)

**Note:** There are no conversation logs stored in this repo. This updated plan is inferred from the original plan (`.cursor/plans/json_schema_validator_site_8765e000.plan.md`) and the **current codebase** — structure, README, and implementation.

---

## Summary: What Changed From the Original Plan

| Original plan | As built |
|--------------|----------|
| Single package root `packages/*` | Two roots: **packages/** and **devops/** |
| `packages/web` (Next.js with API route) | **packages/site** (static Next.js) + **packages/lambdas** (validate API) |
| Validation via Next.js `/api/validate` | Validation via **Lambda** POST `/validate`; site is static, calls Lambda URL |
| Shared config in `packages/tsconfig`, `packages/eslint-config` | Shared config in **devops/tsconfig**, **devops/eslint-config** |
| Provider checkboxes (OpenAI, Google, Anthropic) | **Model groups** from compatibility data; selection by representative (min-cost) model per group |
| Optional client-side JSON Schema check | **schema-utils** + **compatibility-runner**: per-model supported keywords, client-side `validateSchemaForModel()` and optional warnings before API call |
| No deployment spec | **SAM** template: S3 + CloudFront + Lambda; single CloudFront URL for site and `/validate` |

---

## Current Architecture

### Repo layout

- **packages/**  
  - **site** – Next.js app (static export). Validator UI; loads `compatibility.json`; POSTs to `NEXT_PUBLIC_VALIDATE_API_URL/validate`.  
  - **lambdas** – Lambda handler: POST `/validate` (body: `schema`, `modelIds[]` or `providers[]`), returns `results[]`.  
  - **schema-utils** – Shared types, `CompatibilityData`, `validateSchemaForModel`, keyword support helpers.

- **devops/**  
  - **tsconfig** – Shared TypeScript configs (base, next, etc.).  
  - **eslint-config** – Shared ESLint flat config.  
  - **compatibility-runner** – CLI: runs corpus of JSON Schema test files against each configured model, writes **data/compatibility.json** (per-model supported/failed schemas). Used to derive **groups** (models with identical support) and min-cost representative per group.

### Data flow (current)

1. **Compatibility data**  
   Run `pnpm --filter @ssv/compatibility-runner start` → produces `devops/compatibility-runner/data/compatibility.json`.  
   Site build can copy it to `packages/site/public/compatibility.json` (script in `packages/site/scripts/copy-compatibility.js`).

2. **Validator UI**  
   User picks **model groups** (representatives), edits schema in Monaco, clicks Validate.  
   If compatibility data exists, client can run `validateSchemaForModel()` and show warnings (e.g. unsupported keywords) before calling the API.

3. **API**  
   Site POSTs to `{NEXT_PUBLIC_VALIDATE_API_URL}/validate` with `{ schema, modelIds }` (or legacy `providers`).  
   Lambda parses schema, calls each provider with the requested model (or default min-cost per provider), returns `{ results }`.

4. **Deploy**  
   `pnpm run deploy` (SAM): build Lambda + static site, deploy Lambda + S3 + CloudFront. Set Lambda env (API keys); set `NEXT_PUBLIC_VALIDATE_API_URL` to CloudFront (or custom domain) when building the site so `/validate` is on the same origin.

---

## What’s Implemented (Done)

- [x] Monorepo: pnpm workspaces, Turbo, Node ≥22, shared tsconfig and ESLint (under **devops/**).
- [x] Validator UI: model group selection, Monaco schema editor, paste/load file, Validate button, results (per-group/model, latency, errors).
- [x] Codygo-style layout: header, footer, dark theme, single main page + “Model support” page at `/models`.
- [x] Lambda validate API: accepts `schema` + `modelIds[]` or `providers[]`, calls OpenAI / Google / Anthropic with correct schema format, returns aggregated results.
- [x] Model groups and min-cost: compatibility-runner builds compatibility data; groups with identical support; validator uses representative (min-cost) model per group.
- [x] Client-side compatibility checks: `@ssv/schema-utils` `validateSchemaForModel()`; optional warnings on validator page when schema uses features a selected model doesn’t support.
- [x] Models page: `/models` shows which JSON Schema features each model (or group) supports from compatibility data.
- [x] Static site + Lambda deployment: SAM template, deploy script, README for env vars and S3/CloudFront sync.

---

## Possible Next Steps (Inferred)

- **Compatibility data in builds**  
  Ensure compatibility.json is copied into `site/public` (or otherwise available) when building the static site (e.g. in `turbo` or site build script), so the live site has up-to-date groups and model support.

- **Runner in CI**  
  Optionally run compatibility-runner in CI and publish or commit `compatibility.json` (or a versioned artifact) so the site always has current data without manual runs.

- **Lambda env in SAM**  
  Document or template how to pass API keys into the Lambda (e.g. SAM parameters, SSM, or manual Console) so deploy is one-command after secrets are set.

- **Original “out of scope”**  
  Still out of scope unless you decide otherwise: auth/usage limits, schema history/persistence, deep cross-provider schema semantics, older model families.

---

## Out of Scope (Unchanged From Original)

- Auth or usage limits.
- Persistence of schemas or history.
- Deep comparison of schema semantics across providers.
- Supporting older model families (only the specified min-cost / group models).

---

## File Reference (Current)

- **Plan (original):** `.cursor/plans/json_schema_validator_site_8765e000.plan.md`
- **This updated plan:** `.cursor/plans/updated_plan_inferred.md`
- **User-facing docs:** `README.md`, `packages/lambdas/README.md`, `sam/README.md`
