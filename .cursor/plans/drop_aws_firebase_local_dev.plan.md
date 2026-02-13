---
name: Drop AWS, Firebase local dev, move functions to packages
overview: Remove SAM/AWS, use Firebase emulators for local dev with sensible defaults, and move the Firebase functions package from repo root into packages/. Deploy is pnpm scripts only (no bash deploy script, no .env copy).
todos:
  - id: remove-sam
    content: Delete sam/ and remove deploy:aws, dev:lambda from root package.json
    status: pending
  - id: move-functions
    content: Move functions/ to packages/firebase-functions, rename to @ssv/firebase-functions
    status: pending
  - id: wire-firebase
    content: Update firebase.json and root package.json deploy (pnpm only); remove scripts/firebase-deploy.sh
    status: pending
  - id: emulator-scripts
    content: Add dev:emulator script and emulators block in firebase.json
    status: pending
  - id: sensible-defaults
    content: Default apiBaseUrl to same-origin in site; update .env.example and docs
    status: pending
isProject: false
---

# Drop AWS, Firebase-only local dev, move functions to packages

## 1. Move functions to packages

**Target layout:** Firebase Cloud Functions live under the monorepo as `packages/firebase-functions` with package name `@ssv/firebase-functions`.

### Steps

- **Create** `packages/firebase-functions/` and move the entire current root `functions/` tree into it:
  - Move `src/`, `package.json`, `tsconfig.json`
  - Keep the same build output layout: `lib/` with `lib/index.js` as entry (`main` in package.json)
- **Update** the new package’s `package.json`:
  - Set `"name": "@ssv/firebase-functions"`
  - Keep `"main": "lib/index.js"` and the `@ssv/lambdas` workspace dependency
- **Update** `firebase.json`:
  - Set `functions.source` to `"packages/firebase-functions"`
  - Set predeploy to: `["pnpm --filter @ssv/lambdas build", "pnpm --filter @ssv/firebase-functions build"]`
- **Delete** the old root-level `functions/` directory after the move is verified (build or emulator).
- **No deploy script, no .env copy:** Deploy is pnpm-only. Root script: `"deploy": "pnpm run build && firebase deploy"`. Remove `scripts/firebase-deploy.sh`. Do not copy `.env` in scripts. API keys for deployed functions are set via Firebase config/secrets (e.g. manually or in CI from env); local dev uses `.env` in `packages/firebase-functions` or env vars as you prefer.
- **Ignore** `packages/firebase-functions/.env` in `.gitignore` if not already covered.

No change to the code inside the functions (they still import `runValidate` / `runFix` from `@ssv/lambdas`). Only location and config.

---

## 2. Remove SAM and AWS

- **Delete** the `sam/` directory: `template.yaml`, `README.md`, `deploy.sh`, `config.toml`.
- **Root `package.json`:**
  - Remove script `"deploy:aws"`.
  - Remove script `"dev:lambda"`.

---

## 3. Local dev: Firebase emulators only

- **Single flow:** Build (`pnpm build`), then `firebase emulators:start --only functions,hosting`. For function env (API keys), use `packages/firebase-functions/.env` or your usual .env setup; no copy scripts.
- Open **[http://localhost:5000](http://localhost:5000)**; rewrites send `/api/validate` and `/api/fix` to emulated functions.
- **Root package.json:** Add:
  - `"dev:emulator": "firebase emulators:start --only functions,hosting"`
- **firebase.json:** Add an `emulators` block:
  - `"emulators": { "functions": { "port": 5001 }, "hosting": { "port": 5000 } }`

---

## 4. Sensible defaults (local and remote URL)

- **Production and local (hosting emulator):** Same-origin. Use relative `/api/validate` and `/api/fix`.
- **Code change** in `packages/site/src/app/page.tsx`: Set default `apiBaseUrl` to `""`:
  - `process.env.NEXT_API_BASE_URL?.replace(/\/$/, "") ?? ""`
  - Apply in both places (validate and fix handlers).
- **packages/site/.env.example:** Document that `NEXT_API_BASE_URL` is optional; leave empty for same-origin (local 5000 and prod).
- **Docs:** Local URL = [http://localhost:5000](http://localhost:5000); production = Firebase Hosting URL. API keys: use `.env` in the functions package (or root) for local; set Firebase config/secrets for deployed functions (no copy script).

---

## 5. Summary of file changes


| Item                             | Action                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `functions/`                     | Move to `packages/firebase-functions`; name `@ssv/firebase-functions`                                    |
| `firebase.json`                  | `functions.source` → `packages/firebase-functions`; predeploy filter; add `emulators`                    |
| `scripts/firebase-deploy.sh`     | **Remove**; deploy = pnpm only (no .env copy)                                                            |
| Root `package.json`              | Remove `deploy:aws`, `dev:lambda`; add `dev:emulator`; set `deploy`: `pnpm run build && firebase deploy` |
| `sam/`                           | Delete (template.yaml, README.md, deploy.sh, config.toml)                                                |
| `packages/site/src/app/page.tsx` | Default apiBaseUrl to `""`                                                                               |
| `packages/site/.env.example`     | Update comment for same-origin defaults                                                                  |
| `pnpm-workspace.yaml`            | Remove root `"functions"` entry (new package is under `packages/*`)                                      |


