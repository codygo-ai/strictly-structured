# UI Spec: Model Groups, Editor Hints, and Validation

This document describes the target UI for the Structured Schema Validator: how **model groups** work, **editor behavior** (autocomplete and inline hints) and **validation**, without exposing *how* we determine support (so we can change or drop checks later).

---

## Principle: Don't expose how we check

The UI must **not** expose the mechanism we use to decide "supported" or "not supported" (e.g. compatibility data, LCD, API calls). Copy and behavior should be implementation-agnostic:

- We may change how we determine support (different data, different algorithm).
- We may later decide not to call an API, or to add/remove a check.
- User-facing text: neutral (e.g. "Might not work with your selection", "Not supported for selected models"). No "compatibility data", "lowest common denominator", or "we use our table" in the UI.

---

## 1. Model groups in the UI

### What the user sees

- **Model selector**: A list of **groups** (e.g. "OpenAI (3 models, use gpt-4.1-mini)", "Google (2 models, use gemini-2.5-flash)").
- **Multi-select**: The user can select **one or more** groups. Selection drives editor hints and which groups are used when they click Validate.
- **Selection is global**: Same selection is used for editor behavior (autocomplete, inline hints) and for the Validate action.

### Behavior

- If no group is selected: editor can show no restrictions, or a neutral hint like "Select at least one model group."
- When the user changes the selected groups, editor autocomplete and inline hints update immediately (no Validate needed).

---

## 2. Validation and editor feedback (user-facing only)

We do **not** label two "layers" (static vs live) in the UI. The user sees:

- **In the editor**: Autocomplete and inline markers (squiggles) that reflect "what works for your current selection." No mention of *how* we know (data, API, etc.).
- **Validate button**: Runs a check and shows results per group (success/failure, latency, error). We do not promise "this is a live API call" or "this is from our database"; we just show the outcome.

If we later remove the editor checks or change Validate to not call an API, the UI copy doesn't need to change.

---

## 3. Autocomplete and inline errors in the editor

**Constraint**: The editor behaves as if the "allowed" schema language is what works for **all currently selected** groups: autocomplete suggests only that set; anything in the schema that doesn't fit is marked with an inline hint.

### Autocomplete

- **Trigger**: Same as today (e.g. typing, `"` in a key position).
- **Content**: Suggest only JSON Schema keywords that we consider supported for the **current selection** (however we determine that internally).
  - If no group is selected: no keyword suggestions, or all keywords with a neutral note ("Select model groups to narrow suggestions").
  - If one or more groups are selected: suggestion list = whatever our implementation defines as "supported for this selection."
- **Detail**: Short doc per keyword is fine; no need to mention "compatibility" or "LCD."

### Inline hints (squiggles)

- **When**: For keys in the schema that we consider **not supported** for the current selection (implementation-defined).
- **Where**: Monaco diagnostics on the **keyword key** (e.g. the `"pattern"` in `"pattern": "^a+"`).
- **Message (user-facing, neutral)**: e.g. "May not be supported for your selected models." or "Not supported for current selection. Change the schema or change which models are selected." No "LCD", "compatibility data", or "our check."
- **When we recompute**: On schema change or when the set of selected groups changes. No need to say whether this uses an API or not.

### UX flow

1. User selects one or more groups.
2. Editor updates: autocomplete and diagnostics reflect "supported for your selection."
3. User edits schema; they see suggestions and, where relevant, inline hints.
4. User can change the schema or change the selection to clear hints.
5. Validate (if we keep it) runs and shows results; we don't tie that in copy to "live API" or "static check."

---

## 4. Technical notes (implementation only; not for UI copy)

- **Implementation**: Today we use an intersection of supported keywords (LCD) from compatibility data; we may change this. Keep all "LCD", "compatibility", "keywords" logic in code and internal docs only.
- **Schema-utils / SchemaEditor**: Reuse or add helpers that return "allowed set" and "issues" for the current selection; do not surface those type names or "compatibility" in UI strings.
- **Monaco**: Use `monaco.editor.setModelMarkers()` (or equivalent) for diagnostics; map issues to key ranges. Only decorate known JSON Schema keyword keys; ignore e.g. `x-*`.
- **Validate**: May remain a POST to `/validate` (Lambda) or change later; UI should not assume "this calls the API" or "this uses our table."

---

## 5. Summary

| Aspect | User-facing behavior |
|--------|----------------------|
| **Model groups** | Multi-select; selection drives editor hints and what gets validated when the user clicks Validate. |
| **Editor** | Autocomplete and inline hints reflect "what works for your selection"; messages are neutral (e.g. "May not be supported for your selected models"). |
| **Validate** | Button runs a check and shows results per group; we do not expose whether that's an API call or something else. |
| **Principle** | Do not expose *how* we determine support; keep room to change or remove checks later. |

---

## 6. Single source of truth (technical + user-facing)

**One artifact** carries both technical data and user-facing copy:

- **Technical**: `models` (supported/failed, `supported_keywords`), `groups` (id, modelIds, representative), `schemas`.
- **User-facing**: Per group: `displayName`, `note`, and `keywordRules` — each rule has `requirement`, `errorMessage`, `suggestion`, `severity`, and optional `allowed` override.

**Build**: The compatibility runner writes model results and derives groups; it then merges in **display-config.json** (curated copy keyed by group representative). Output is **compatibility.json** (v3). One file at runtime = single source of truth.

**Consumption**: Model selector uses `displayName` when present. Editor squiggles use `errorMessage` and `suggestion` from the group’s `keywordRules` for the reported keyword. A future “Special requirements” panel can show `requirement` / `note` per selected group.

---

## 7. Special requirements per model group (optional section)

A **read-only section** can show per–model-group guidance using the **same single source**: `groups[].displayName`, `note`, and `keywordRules[].requirement` / `note`.

- **Placement**: e.g. collapsible panel, tab, or sidebar; visible when one or more groups are selected.
- **Copy**: Neutral; show "For [displayName]: …" and the requirement/note from the data.
