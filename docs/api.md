# Backend API Reference

The backend (`packages/backend`) runs as Firebase Cloud Functions and provides four endpoints. Two require Firebase Auth; two are public.

## Endpoints

### POST `/api/validate` (requires auth)

Validates a JSON schema against real provider endpoints (OpenAI, Anthropic, Google). Sends the schema to the actual provider API and returns per-model results.

### POST `/api/fix` (requires auth)

Auto-fixes a JSON schema using the OpenAI API (LLM-based fix, not the local rule-based fixer). Accepts the schema and a list of issues, returns a suggested fixed schema.

### POST `/api/evaluate` (public)

Ingests anonymous audit events from the frontend. No auth required — events contain no PII. Accepts an array of audit events and writes them to Firestore.

### POST `/api/feedback` (public)

Submits user feedback (bug reports, feature requests, general feedback). Creates a GitHub issue with appropriate labels. Requires a `GITHUB_PAT` secret in production.

## Authentication

`/api/validate` and `/api/fix` require a Firebase Auth token passed as a Bearer token in the Authorization header. The frontend triggers Google sign-in and passes the token automatically. Requests without a valid token receive a 401 response.

## API Keys

The backend uses four secrets:
- **OpenAI** — `OPENAI_API_KEY`
- **Anthropic** — `ANTHROPIC_API_KEY`
- **Google Generative AI** — `GOOGLE_GENERATIVE_AI_API_KEY`
- **GitHub** — `GITHUB_PAT` (for creating feedback issues)

In production, keys are stored in Google Secret Manager (set via the `set-secrets` script). For local development, they go in `packages/backend/.env` (see `packages/backend/.env.sample`).
