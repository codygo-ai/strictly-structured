# Claude Code Project Instructions

## Plan Mode

Always enter plan mode before making any code changes. Every non-trivial task must be planned and approved before implementation begins.

## Cursor Rules

All project rules are defined in `.cursor/rules/`. Read and follow every rule file before planning or making any changes:

- `.cursor/rules/code-quality.mdc` — Core principles, code style, error handling
- `.cursor/rules/typescript-rules.mdc` — TypeScript type safety rules
- `.cursor/rules/project-structure.mdc` — Monorepo structure, pnpm, package imports
- `.cursor/rules/mandatory-checklist.mdc` — Lint, typecheck, test after every change
- `.cursor/rules/commit-messages.mdc` — Conventional Commits format

These are the single source of truth. Do not duplicate their content here.
