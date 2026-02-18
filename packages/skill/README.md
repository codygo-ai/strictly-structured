# @ssv/skill

Claude Code / Cursor skill plugin for validating JSON schemas against LLM provider rules.

## Layout

- **`build.ts`** — TypeScript build script: assembles the plugin into `dist/validate-schema/` (run with `tsx`).
- **`src/validate.mjs`** — Standalone ESM validator script (zero deps); copied into the plugin by the build.
- **`skills/validate-schema/`** — Plugin content: SKILL.md, reference docs, examples. Copied as-is by the build.
- **`tsconfig.json`** — TypeScript config for `build.ts` (used by lint/typecheck).

## Scripts (monorepo standard)

- **lint** — `eslint build.ts src` — Lints all package code (TS + .mjs). Root ESLint config applies; `.mjs` uses plain JS rules.
- **typecheck** — `tsc --noEmit` — Type-checks `build.ts`.
- **build** — `tsx build.ts` — Produces `dist/validate-schema/` with plugin.json, scripts, rules, reference, examples.

Run from repo root: `pnpm exec turbo run lint typecheck build --filter=@ssv/skill`.
