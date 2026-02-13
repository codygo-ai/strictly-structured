# Single source of truth: technical + user-facing data

We use **one artifact** for both technical behavior and user-facing copy. No separate “compatibility” vs “requirement” sources at runtime.

---

## What is the single source?

**compatibility.json (v3)** is the only runtime source. It contains:

| Part | Technical | User-facing |
|------|-----------|-------------|
| **models** | supported, failed, supported_keywords | — |
| **groups** | id, provider, modelIds, representative | displayName, note, keywordRules |
| **keywordRules** (per group, per keyword) | allowed (override) | requirement, errorMessage, suggestion, severity, note |

- **Validation / LCD**: Uses `supported_keywords` (and rule `allowed` overrides, e.g. `nullable: false` for OpenAI).
- **Editor squiggles**: Message and suggestion come from `keywordRules[keyword]` when present.
- **Model selector label**: Uses `displayName` when present.
- **Future “Special requirements” panel**: Uses `displayName`, `note`, and `keywordRules[].requirement` / `note`.

---

## How it is built

1. **Compatibility runner** runs API tests → writes model results and derives groups (technical only).
2. **Display config** (`config/display-config.json`) holds curated copy: keyed by group representative id, with `displayName`, `note`, and `keywordRules` per keyword.
3. **Merge** (inside the runner’s write step): for each group, merge `display-config.groups[representative]` into the group. Output is one **compatibility.json** (v3).

So: **two inputs** (runner output + display-config), **one output** (compatibility.json). All user-facing strings live in display-config; the runner merges them into the single artifact.

---

## Display config (curated copy)

Edit **devops/compatibility-runner/config/display-config.json** to change:

- Group labels (`displayName`)
- Group-level notes (`note`)
- Per-keyword: `requirement`, `errorMessage`, `suggestion`, `severity`, `note`, and optional `allowed` override (e.g. `nullable: { "allowed": false, "errorMessage": "...", "suggestion": "..." }`).

After changing display-config, re-run the compatibility runner (or a merge-only script if we add one) to regenerate compatibility.json.

---

## Keyword rules and validation

- **allowed**: When set, overrides compatibility for that keyword (e.g. `nullable: false` for OpenAI even though we don’t test nullable in the runner).
- **errorMessage**: Shown on editor squiggle and validation when the keyword is disallowed.
- **suggestion**: Shown after the message (e.g. "→ Use anyOf: [{type: 'string'}, {type: 'null'}]").
- **requirement** / **note**: For the optional “Special requirements” panel; not yet used in squiggles.

---

## Summary

| Question | Answer |
|----------|--------|
| Where do technical data and user-facing copy live? | In the same file: **compatibility.json** (v3). |
| Where do I edit user-facing strings? | In **config/display-config.json**; they are merged into compatibility.json at build time. |
| How does the UI get messages/suggestions? | From **groups[].keywordRules[keyword]** in the loaded compatibility data. |
