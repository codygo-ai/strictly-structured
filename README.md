# Structured Schema Validator

**Structured Schema Validator** is an open-source tool by [Codygo](https://codygo.com) that validates JSON schemas for use with LLM structured outputs. Pick one or more providers (OpenAI GPT-4+, Google Gemini 2.5+, Anthropic Claude 3.5+), paste or load a schema, and see whether each provider’s min-cost model accepts it.

## Monorepo

This repo uses two package roots: **packages/** and **devops/**.

**packages/** (apps and shared libs):

- **site** – Next.js app (static export): validator UI only
- **lambdas** – Lambda: POST `/validate` API used by the static site
- **schema-utils** – Shared types and helpers for compatibility and validation

**devops/** (tooling and data):

- **tsconfig** – Shared TypeScript config
- **eslint-config** – Shared ESLint flat config
- **compatibility-runner** – CLI to run schema corpus against providers and write compatibility data
- **compatibility-data** – Generated compatibility JSON (output of the runner)
- **schema-corpus** – Curated JSON Schema test cases for compatibility runs

The site is **static only**. All validation requests are sent to the Lambda. Set `NEXT_PUBLIC_VALIDATE_API_URL` to your Lambda Function URL or API Gateway base URL when building the site.

## Run the app

1. Install dependencies from the repo root:

   ```bash
   pnpm install
   ```

2. **Static site (packages/site)**  
   Set `NEXT_PUBLIC_VALIDATE_API_URL` to your deployed validate API base URL (e.g. Lambda Function URL). See `packages/site/.env.example`. For local dev you can point it at a local Lambda or a deployed URL.

3. From the repo root:

   ```bash
   pnpm dev
   ```

   This runs the Next.js app (e.g. http://localhost:3000). The **Validate** button will work only when `NEXT_PUBLIC_VALIDATE_API_URL` is set and the API is reachable.

4. **Lambda (packages/lambdas)**  
   Deploy the Lambda (see `packages/lambdas/README.md`). Set env vars on the Lambda: `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`. Then use the Lambda Function URL (or API Gateway URL) as `NEXT_PUBLIC_VALIDATE_API_URL` when building the static site.

## Scripts (root)

- `pnpm dev` – Start the web app in development
- `pnpm build` – Build all packages (Turbo): static site output in `packages/site/out`, Lambda bundle in `packages/lambdas/dist`
- `pnpm lint` – Lint all packages
- `pnpm typecheck` – Type-check all packages

## How it works

1. You choose which providers to validate against (OpenAI, Google, Anthropic).
2. You provide a JSON schema (paste, type in the editor, or load from a file).
3. You click **Validate**.
4. The app calls each selected provider’s min-cost model with your schema (e.g. `response_format` / `responseSchema` / `output_config`) and a minimal prompt.
5. Results show per provider: success/failure, model used, latency, and any error message.

Open source by Codygo.
