# Backend API Reference

The backend (`packages/backend`) runs as Firebase Cloud Functions and provides two endpoints. Both require authentication.

## Endpoints

### POST `/api/validate`

Validates a JSON schema against a real provider endpoint.

<!-- TODO: Document request/response format, auth requirements, error codes -->

### POST `/api/fix`

Auto-fixes a JSON schema for a given provider.

<!-- TODO: Document request/response format, auth requirements, error codes -->

## Authentication

Both endpoints require a Firebase Auth token. The frontend triggers Google sign-in and passes the token automatically.

<!-- TODO: Document how auth is enforced, what happens without a token -->

## API Keys

The backend calls three provider APIs:
- **OpenAI** — `OPENAI_API_KEY`
- **Anthropic** — `ANTHROPIC_API_KEY`
- **Google Generative AI** — `GOOGLE_GENERATIVE_AI_API_KEY`

In production, keys are stored in Google Secret Manager. For local development, they go in `packages/backend/.env` (see `packages/backend/.env.sample`).
