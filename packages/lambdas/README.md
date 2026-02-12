# @ssv/lambdas

Lambda handler for the Structured Schema Validator. Exposes a single POST endpoint that validates a JSON schema against OpenAI, Google Gemini, and Anthropic Claude using each provider’s min-cost model.

## Interface

- **POST** (e.g. `/validate` or Function URL root)
  - Body: `{ "schema": "<JSON string>", "providers": ["openai", "google", "anthropic"] }`
  - Response: `{ "results": [ { "provider", "model", "ok", "latencyMs", "error?" } ] }`
- **OPTIONS**: returns 204 with CORS headers.

## Environment (Lambda)

- `OPENAI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`

## Build

```bash
pnpm build
```

Output: `dist/handler.js`. Configure Lambda to use **Handler** `handler.handler` (or the path to the built file and export name).

## Deploy

Deploy `dist/handler.js` (and `node_modules` if not bundled) to AWS Lambda with Node 18+ runtime. Use a **Function URL** or **API Gateway HTTP API** and set the base URL in the static site as `NEXT_PUBLIC_VALIDATE_API_URL`.
