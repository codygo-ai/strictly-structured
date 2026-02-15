# Deployment

Strictly Structured deploys to Firebase (Hosting + Cloud Functions).

## Prerequisites

- Firebase CLI installed and authenticated (`firebase login`)
- Project configured in `.firebaserc` (e.g. `codygo-website`)
- Hosting site set in `firebase.json` (e.g. `structured-output`)

## API Keys

Place API keys in `packages/backend/.env`:

```
OPENAI_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
ANTHROPIC_API_KEY=...
```

The predeploy script reads this file and creates/updates secrets in Google Secret Manager. Cloud Functions access them at runtime.

## Deploy

From the repo root:

```bash
pnpm run deploy
```

This runs `pnpm build` followed by `firebase deploy` (hosting + functions).

- Frontend static export is served from `packages/frontend/out`
- `/api/validate` and `/api/fix` are rewritten to Cloud Functions

## Local Development

```bash
pnpm dev
```

Runs in parallel:
- Next.js dev server with hot reload (http://localhost:3000)
- Backend build in watch mode (`tsup`)
- Firebase emulators (functions + hosting)

The dev server proxies `/api/validate` and `/api/fix` to the emulator. Before starting, the emulator step copies `.env` into `packages/backend/.deployed` so functions load the keys.

### Emulator Only

```bash
pnpm dev:emulator   # Hosting at :5050, functions at :5001
pnpm dev:frontend   # Next.js dev server only
```
