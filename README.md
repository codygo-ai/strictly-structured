# Structured Schema Validator

**Structured Schema Validator** is an open-source tool by [Codygo](https://codygo.com) that validates JSON schemas for use with LLM structured outputs. Pick one or more providers (OpenAI, Google, Anthropic), paste or load a schema, and see whether each provider’s model accepts it. Default models: **gpt-4.1-mini**, **gemini-2.5-flash**, **claude-3-5-haiku**.

## Monorepo

This repo uses **packages/**, **devops/**, and **functions/**.

**packages/** (apps and shared libs):

- **site** – Next.js app (static export): validator UI; Firebase client + Analytics when configured
- **lambdas** – Shared validate logic; used by the Firebase Cloud Function and by local dev / optional AWS Lambda
- **schema-utils** – Shared types and helpers for compatibility and validation

**functions/** – Firebase Cloud Functions: HTTP `validate` (POST `/api/validate`) and `fix` (POST `/api/fix`), both require auth; deployed with Hosting.

**devops/** (tooling and data):

- **tsconfig** – Shared TypeScript config
- **eslint-config** – Shared ESLint flat config
- **compatibility-runner** – Test schemas + CLI; output: `data/compatibility.json`

The site is **static only**. Validation requests go to the validate API. On Firebase Hosting, leave `NEXT_PUBLIC_VALIDATE_API_URL` empty for same-origin `/api/validate` and `/api/fix`; otherwise set it to your API base URL.

## Run the app

1. Install dependencies from the repo root:

   ```bash
   pnpm install
   ```

2. **Static site (packages/site)**  
   See `packages/site/.env.example`. For same-origin validate (e.g. after Firebase deploy), leave `NEXT_PUBLIC_VALIDATE_API_URL` empty. For local dev, point it at a local Lambda (`pnpm dev:lambda`) or a deployed URL.

3. From the repo root:

   ```bash
   pnpm dev
   ```

   This runs the Next.js app (e.g. http://localhost:3000). Use **Validate** with a reachable API (local Lambda or deployed).

4. **Local validate API**  
   Run `pnpm dev:lambda` for a local server at http://localhost:3001 (POST `/validate`). Set `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY`), and `ANTHROPIC_API_KEY` in `.env` at project root.

## Deploy (Firebase)

Default deploy target is **Firebase** (Hosting + Functions).

1. Ensure **Firebase CLI** is installed and you're logged in (`firebase login`). Project is set in `.firebaserc` (e.g. `codygo-website`); Hosting site is `structured-output` in `firebase.json`.

2. Put API keys in **`.env`** at project root: `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY`), `ANTHROPIC_API_KEY`. The deploy script copies `.env` into `functions/.env` so the validate Cloud Function receives them.

3. From the repo root:

   ```bash
   pnpm run deploy
   ```

   This builds all packages, copies `.env` to `functions/.env`, and runs `firebase deploy` (hosting + functions). The site is served from `packages/site/out`; `/api/validate` and `/api/fix` are rewritten to Cloud Functions (auth required) so the same origin is used.

**Optional: deploy to AWS**  
Use `pnpm run deploy:aws` to deploy with SAM (Lambda + S3 + CloudFront) instead.

## Scripts (root)

- `pnpm dev` – Start the web app in development
- `pnpm build` – Build all packages (Turbo): site → `packages/site/out`, lambdas → `packages/lambdas/dist`, functions → `functions/lib`
- `pnpm lint` – Lint all packages
- `pnpm typecheck` – Type-check all packages
- `pnpm dev:lambda` – Local validate API (http://localhost:3001)
- `pnpm run deploy` – Deploy to Firebase (hosting + functions)
- `pnpm run deploy:aws` – Deploy to AWS (SAM)

## How it works

1. **Model groups**: The compatibility runner tests all configured models; models with identical schema support are grouped. The validator shows one option per group and uses the **minimal-cost model** in that group at runtime (e.g. nano/mini/lite).
2. You pick which groups to validate against, then paste or load a JSON schema.
3. You click **Validate**. The API is called with the representative (min-cost) model for each selected group.
4. Results show per group: success/failure, model used, latency, and any error message.

Open source by Codygo.
