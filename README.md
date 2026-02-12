# Structured Schema Validator

**Structured Schema Validator** is an open-source tool by [Codygo](https://codygo.com) that validates JSON schemas for use with LLM structured outputs. Pick one or more providers (OpenAI, Google, Anthropic), paste or load a schema, and see whether each provider’s model accepts it. Default models: **gpt-4.1-mini**, **gemini-2.5-flash**, **claude-3-5-haiku**.

## Monorepo

This repo uses two package roots: **packages/** and **devops/**.

**packages/** (apps and shared libs):

- **site** – Next.js app (static export): validator UI only
- **lambdas** – Lambda: POST `/validate` API used by the static site
- **schema-utils** – Shared types and helpers for compatibility and validation

**devops/** (tooling and data):

- **tsconfig** – Shared TypeScript config
- **eslint-config** – Shared ESLint flat config
- **compatibility-runner** – Test schemas + CLI to run them against each provider/model and write compatibility data (output: `data/compatibility.json`)

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

1. **Model groups**: The compatibility runner tests all configured models; models with identical schema support are grouped. The validator shows one option per group and uses the **minimal-cost model** in that group at runtime (e.g. nano/mini/lite).
2. You pick which groups to validate against, then paste or load a JSON schema.
3. You click **Validate**. The API is called with the representative (min-cost) model for each selected group.
4. Results show per group: success/failure, model used, latency, and any error message.

Open source by Codygo.
