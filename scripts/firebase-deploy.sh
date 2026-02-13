#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building all packages..."
pnpm run build

# Use project .env for Firebase Functions (Firebase loads functions/.env at deploy)
if [ -f ".env" ]; then
  echo "Copying .env to functions/.env for deploy..."
  cp .env functions/.env
else
  echo "Warning: No .env at project root. Ensure functions/.env exists with OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY), ANTHROPIC_API_KEY for the validate function."
fi

echo "Deploying to Firebase (hosting + functions)..."
firebase deploy

echo "Done."
