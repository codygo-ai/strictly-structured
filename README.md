# Structured Schema Validator

**Structured Schema Validator** is an open-source tool by [Codygo](https://codygo.com) that validates JSON schemas for use with LLM structured outputs. Pick one or more providers (OpenAI, Google, Anthropic), paste or load a schema, and see whether each provider’s model accepts it. Default models: **gpt-4.1-mini**, **gemini-2.5-flash**, **claude-3-5-haiku**.

## Monorepo

This repo uses **packages/** and **devops/**.

**packages/** (apps and shared libs):

- **frontend** – Next.js app (static export): validator UI; Firebase client + Analytics when configured
- **backend** – Firebase Cloud Functions: HTTP `validate` (POST `/api/validate`) and `fix` (POST `/api/fix`), both require auth; contains server-only logic that calls OpenAI/Google/Anthropic APIs
- **schema-utils** – Shared types and helpers for **compatibility data and schema validation**; used by the **frontend** only (client-safe, no API keys). Different from backend: schema-utils does not call LLM APIs; it parses schemas, validates structure, and provides types for the UI

**devops/** (tooling and data):

- **tsconfig** – Shared TypeScript config
- **eslint-config** – Shared ESLint flat config
- **compatibility-runner** – Test schemas + CLI; output: `data/compatibility.json`

The site is **static only**. API calls use the same origin: on localhost the dev server proxies to the emulator; when deployed, Hosting rewrites to Cloud Functions.

## Run the app

1. Install dependencies from the repo root:

   ```bash
   pnpm install
   ```

2. **Local dev (recommended)**  
   From the repo root, `pnpm dev` runs in parallel: Next.js (with hot reload), backend build in watch mode, and Firebase emulators (functions + hosting). Open **http://localhost:3000**; the app proxies `/api/validate` and `/api/fix` to the emulator. Put API keys in `packages/backend/.env` (see `packages/backend/.env.sample`). Before starting, the emulator step copies `.env` into `packages/backend/.deployed` so the functions load them.

   ```bash
   pnpm dev
   ```

   Then open http://localhost:3000.

3. **Emulator or frontend only**  
   `pnpm dev:emulator` runs only Firebase emulators (hosting at http://localhost:5050, functions at 5001). `pnpm dev:frontend` runs only the Next.js dev server.

## Deploy (Firebase)

Default deploy target is **Firebase** (Hosting + Functions).

1. Ensure **Firebase CLI** is installed and you're logged in (`firebase login`). Project is set in `.firebaserc` (e.g. `codygo-website`); Hosting site is `structured-output` in `firebase.json`.

2. Put API keys in `packages/backend/.env` (see `packages/backend/.env.sample`): `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `ANTHROPIC_API_KEY`. The predeploy script reads this file and creates/updates these three secrets in Google Secret Manager; the Cloud Functions use them at runtime. For local emulator, the same `.env` is copied into `.deployed` before the emulator starts.

3. From the repo root:

   ```bash
   pnpm run deploy
   ```

   This runs `pnpm run build` then `firebase deploy` (hosting + functions). The site is served from `packages/frontend/out`; `/api/validate` and `/api/fix` are rewritten to Cloud Functions (auth required) so the same origin is used.

## Scripts (root)

- `pnpm dev` – Run frontend (Next.js HMR), backend (tsup watch), and Firebase emulators in parallel; open http://localhost:3000 (API proxied automatically)
- `pnpm dev:frontend` – Next.js dev server only
- `pnpm dev:backend` – Backend build in watch mode only
- `pnpm dev:emulator` – Firebase emulators (functions + hosting) at http://localhost:5050
- `pnpm build` – Build all packages (Turbo): frontend → `packages/frontend/out`, backend → `packages/backend/lib`, schema-utils → `packages/schema-utils/dist`
- `pnpm lint` – Lint all packages
- `pnpm typecheck` – Type-check all packages
- `pnpm run deploy` – Build and deploy to Firebase (hosting + functions)

## How it works

1. **Model groups**: The compatibility runner tests all configured models; models with identical schema support are grouped. The validator shows one option per group and uses the **minimal-cost model** in that group at runtime (e.g. nano/mini/lite).
2. You pick which groups to validate against, then paste or load a JSON schema.
3. You click **Validate**. The API is called with the representative (min-cost) model for each selected group.
4. Results show per group: success/failure, model used, latency, and any error message.

Open source by Codygo.
