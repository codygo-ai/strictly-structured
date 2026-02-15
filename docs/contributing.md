# Contributing

## Getting Started

1. Clone the repo
2. Install dependencies: `pnpm install`
3. Run locally: `pnpm dev`

## Project Rules

All coding standards are defined in `.cursor/rules/`:

- **code-quality.mdc** — Core principles, code style, error handling
- **typescript-rules.mdc** — TypeScript type safety rules
- **project-structure.mdc** — Monorepo structure, pnpm, package imports
- **mandatory-checklist.mdc** — Lint, typecheck, test after every change
- **commit-messages.mdc** — Conventional Commits format

Read and follow these before making changes.

## Workflow

1. Create a branch from `main`
2. Make changes
3. Run checks:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/) format
5. Open a PR against `main`

## Monorepo

This project uses pnpm workspaces and Turborepo. See [architecture.md](architecture.md) for the full structure.

- Shared config lives in `devops/`
- Application code lives in `packages/`
- The canonical data source is `packages/schemas/data/schemaRuleSets.json`
