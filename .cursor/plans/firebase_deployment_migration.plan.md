---
name: ""
overview: ""
todos: []
isProject: false
---

# Firebase deployment migration (updated)

## Overview

Migrate deployment from AWS (SAM: Lambda + S3 + CloudFront) to Firebase Hosting and Firebase Functions. Use the project’s `**.env**` as the source of API keys when deploying (no manual `firebase functions:config:set` or Secret Manager for these keys).

---

## API keys: use project `.env` when deploying

- **Source of truth**: API keys live in the project’s `**.env**` at repo root (same file used for local Lambda dev and site; already in [.gitignore](.gitignore)).
- **Keys used by the validate function**: `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` (as in [packages/lambdas/src/handler.ts](packages/lambdas/src/handler.ts) and [sam/README.md](sam/README.md)).
- **At deploy time**: The deploy script will:
  1. **Load** the project’s `.env` (e.g. from repo root).
  2. **Push** those keys into Firebase so the deployed Cloud Function can read them (see options below).
  3. Then run `firebase deploy` (or `firebase deploy --only functions,hosting`).

**Ways to “use .env when deploying”:**

- **Option A (recommended)**  
Before `firebase deploy`, run a small script (e.g. `scripts/firebase-set-env.sh` or Node) that:
  - Reads `.env` from the project root (or a path you choose).
  - For each required key, runs e.g. `firebase functions:config:set openai.api_key="$(value)"` (or the 2nd-gen equivalent).
  - Then the Firebase Function code reads config via `functions.config()` (1st gen) or the env vars you set (2nd gen).  
  Result: one `pnpm run deploy` with a populated `.env`; no manual Firebase config steps.
- **Option B**  
Use a **pre-deploy hook** in `firebase.json` that runs a script to export env from `.env` and call `firebase functions:config:set` (or set Cloud Run env) so the same keys are used when the functions are deployed.
- **Option C**  
If you prefer not to use Firebase’s stored config: the deploy script writes a `**functions/.env**` from the project’s `.env` (only at deploy time, not committed), and the Functions build bundles or loads these at runtime. This requires that your Functions runtime actually loads `functions/.env` (e.g. via `dotenv` and ensuring the file is present only in CI/local when deploying). Firebase does not deploy `.env` by default (often in `.gcloudignore`), so Option A is usually simpler and more standard.

**Recommendation:** Use **Option A**: a deploy script that reads the project’s `.env` and runs `firebase functions:config:set` (or the equivalent for 2nd-gen functions) for each of the three provider keys, then runs `firebase deploy`. Document in README: “Put your API keys in `.env` at project root; `pnpm run deploy` will use them for the Firebase validate function.”

**Docs to add:**

- In README: “For Firebase deploy, ensure `.env` at project root contains `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY`), and `ANTHROPIC_API_KEY`. The deploy script loads these and configures the validate function.”
- Optionally add a root `.env.example` (or extend an existing one) listing these keys (with empty values), so new contributors know what to set.

---

## Firebase project and client config

- **.firebaserc**: `projectId`: `codygo-website`.
- **firebase.json** hosting: `"site": "structured-output"`, `"public": "packages/site/out"` (or `public` with a copy step). Rewrite `/validate` to the Cloud Function.
- **Site client config** (use env vars in code; this is the reference for `.env.example` / docs):

```js
const firebaseConfig = {
  apiKey: "AIzaSyCxkbcNcv0LvseHtMu5fsh3UixX4q_6fBM",
  authDomain: "codygo-website.firebaseapp.com",
  projectId: "codygo-website",
  storageBucket: "codygo-website.appspot.com",
  messagingSenderId: "518648006371",
  appId: "1:518648006371:web:aeaf1060951b6af31fa7d6",
  measurementId: "G-E0XCL0J9N0"
};
```

Wire these via `NEXT_PUBLIC_FIREBASE_*` in the site so the same code works across environments; add them to `packages/site/.env.example`.

---

## Rest of the migration (unchanged)

- **Refactor** [packages/lambdas](packages/lambdas): extract `runValidate(body)` from the Lambda handler; keep existing `handler` for local dev.
- **Add** Firebase: `firebase.json`, `.firebaserc`, Hosting **site `structured-output**`, `public`: `packages/site/out` or `public` with a copy step; rewrite `/validate` to the Cloud Function.
- **Add** `functions/` with an HTTP function that calls `runValidate`, CORS, and returns the same JSON; configure it to read the API keys from Firebase config (or env) that was set from `.env` in the deploy script.
- **Site**: Firebase client + Analytics from env-based config; same-origin `/validate` when `NEXT_PUBLIC_VALIDATE_API_URL` is empty.
- **Deploy script**: Build site → (optional) copy `packages/site/out` → `public` → **load `.env` and set Firebase function config** → `firebase deploy`.

No API keys in repo or in client; they stay in `.env` and are only pushed to Firebase at deploy time by the script.