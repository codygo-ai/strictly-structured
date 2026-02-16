# Strictly Structured

**Strictly Structured** is an open-source toolset by [Codygo](https://codygo.com) that validates and auto-fixes JSON schemas for LLM structured output APIs across OpenAI, Anthropic, and Google Gemini. It ships through three channels: a web app, an MCP server, and a Claude Code / Cursor skill.

## Monorepo

This repo uses **pnpm workspaces** and **Turborepo**. Code lives in `packages/` and `devops/`.

### packages/

| Package | Description |
|---------|-------------|
| **frontend** | Next.js 15 static export — validator UI with Monaco editor, live markers, auto-fix |
| **backend** | Firebase Cloud Functions — `/api/validate`, `/api/fix`, `/api/evaluate`, `/api/feedback` |
| **schemas** | Canonical rule sets, validation engine (`validateSchemaForRuleSet`), auto-fix engine (`fixSchemaForRuleSet`), types |
| **mcp-server** | MCP server — 8 tools (schema validation, code conversion, SDK simulation) + 3 prompts |
| **skill** | Claude Code / Cursor skill plugin for conversational schema validation |
| **codegen** | Zod/Pydantic ↔ JSON Schema conversion, SDK transform simulation |
| **audit** | Shared audit event types and utilities |

### devops/

| Package | Description |
|---------|-------------|
| **tsconfig** | Shared TypeScript configuration |
| **eslint-config** | Shared ESLint flat config |

The single source of truth for provider rules is `packages/schemas/data/schemaRuleSets.json`.

## Run the app

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. **Local dev (recommended)** — runs Next.js (hot reload), backend build (tsup watch), and Firebase emulators in parallel:

   ```bash
   pnpm dev
   ```

   Open http://localhost:3000. The dev server proxies `/api/*` to the emulator. Put API keys in `packages/backend/.env` (see `packages/backend/.env.sample`).

3. **Emulator or frontend only:**

   ```bash
   pnpm dev:emulator   # Firebase emulators: hosting at :5050, functions at :5001
   pnpm dev:frontend   # Next.js dev server only
   ```

## Deploy (Firebase)

1. Install Firebase CLI and log in (`firebase login`). Project is set in `.firebaserc`; hosting site is `structured-output`.

2. Place API keys in `packages/backend/.env`:
   ```
   OPENAI_API_KEY=...
   GOOGLE_GENERATIVE_AI_API_KEY=...
   ANTHROPIC_API_KEY=...
   GITHUB_PAT=...
   ```

3. Deploy:
   ```bash
   pnpm run deploy
   ```
   This builds all packages then runs `firebase deploy` (hosting + functions).

## Scripts (root)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Frontend + backend + Firebase emulators in parallel |
| `pnpm dev:frontend` | Next.js dev server only |
| `pnpm dev:backend` | Backend build in watch mode only |
| `pnpm dev:emulator` | Firebase emulators only |
| `pnpm build` | Build all packages (Turbo) |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm run deploy` | Build and deploy to Firebase |

## How it works

1. **Rule sets** group providers with identical schema support (e.g. GPT 4+, Claude 4.5+, Gemini 2.5+).
2. User picks a rule set, pastes or loads a JSON schema in the Monaco editor.
3. **Client-side validation** runs automatically (200ms debounce) — markers appear as squiggly underlines on problematic lines.
4. **Auto-fix** applies mechanical fixes (add `additionalProperties: false`, move unsupported fields to `required`, etc.).
5. **Optional server validation** sends the schema to the actual provider endpoint for real-world testing (requires auth).

## Documentation

See [docs/](docs/) for detailed documentation:

- [Architecture](docs/architecture.md) — monorepo structure, data flow, tech stack
- [API Reference](docs/api.md) — backend endpoints and auth
- [MCP Server](docs/mcp-server.md) — tools, prompts, setup instructions
- [Skill Plugin](docs/skill.md) — Claude Code / Cursor skill
- [Design System](docs/design-system.md) — CSS tokens and Tailwind utilities
- [Deployment](docs/deployment.md) — Firebase deploy and local dev
- [Contributing](docs/contributing.md) — workflow and project rules
- [Vocabulary](docs/vocabulary.md) — schema vs meta-schema vs metadata

Open source by Codygo.
