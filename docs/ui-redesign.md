# Frontend UI Redesign Proposal

> **Status**: Draft
> **Scope**: packages/frontend — user-facing UX and component changes

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [What Works Well (Keep)](#2-what-works-well-keep)
3. [Identified Issues](#3-identified-issues)
4. [Proposed Layout](#4-proposed-layout)
5. [Component-Level Changes](#5-component-level-changes)
6. [New Components](#6-new-components)
7. [Promoting MCP & Skill Integrations](#7-promoting-mcp--skill-integrations)
8. [Removed / Absorbed](#8-removed--absorbed)
9. [User Journey (Redesigned)](#9-user-journey-redesigned)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Current State Summary

**"Strictly Structured"** — a product for validating, auto-fixing, and optimizing JSON Schemas for LLM structured output APIs (OpenAI, Anthropic/Claude, Google/Gemini).

### Distribution Channels

The product ships through three channels. The **web tool** is the discovery and exploration surface; the **MCP server** and **skill plugin** are where developers get recurring value in their actual workflow.

| Channel | Package | For whom | Key actions |
|---------|---------|----------|-------------|
| **Web tool** | `packages/frontend` | Any developer, via browser | Explore, paste schema, validate, fix, export |
| **MCP Server** | `packages/mcp-server` | Cursor, Claude Desktop, any MCP client | `validate_schema`, `fix_schema`, `list_groups` tools |
| **Skill plugin** | `packages/skill` | Cursor / Claude Code users | Conversational in-editor validation |

The web tool currently has **zero awareness** of the MCP and skill channels. This redesign adds promotion touchpoints (see [Section 7](#7-promoting-mcp--skill-integrations)).

### Pages

| Route     | Purpose                                                       |
| --------- | ------------------------------------------------------------- |
| `/`       | Main validator — editor + provider bar + reference sidebar    |
| `/why`    | Static explainer (3 cards on why the tool exists)             |
| `/models` | Comparison table + detailed RuleSetCards per provider         |
| `/terms`  | Terms of use                                                  |

### Current main page layout

```
┌──────────────────────────────────────────────────────────┐
│  Header: title, subtitle, nav (Validator | Why | Models) │
├──────────────────────────────────────────────────────────┤
│  Model Bar: [OpenAI GPT] [Anthropic Claude] [Google Gemini]  │  ← radio-style
├────────────────────────────┬─────────────────────────────┤
│  Schema Editor (Monaco)    │  Right Pane (reference)     │
│  • live markers from       │  • Description & models     │
│    ruleSetValidator         │  • Requirements              │
│  • default schema loaded   │  • Supported Keywords        │
│                            │  • Unsupported Keywords      │
│  [Server Validation]       │  • Quantitative Limits       │
│  [Auto-fix]                │  • Behaviors                 │
│                            │  • Best Practices            │
│                            │  • Issues & Auto-Fix (dead)  │
├────────────────────────────┴─────────────────────────────┤
│  (error toast, fixed at bottom center)                   │
│  (validation results modal, overlay)                     │
└──────────────────────────────────────────────────────────┘
```

### Core validation flow (already working)

1. User types in editor → `ruleSetValidator` runs (200ms debounce)
2. Returns `SchemaMarker[]` with line/col positions, messages, severities
3. Markers set on Monaco model → squiggly underlines in editor
4. Markers are contextual to the selected rule set
5. User hovers a marker → sees the error message

This is the **primary feedback loop** and it works well.

---

## 2. What Works Well (Keep)

| Feature                                                | Why it works                                                                                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Live editor markers**                                | Real-time feedback on the exact line, contextual to the selected rule set. This is the core value.                                                                                  |
| **Single rule-set selection (radio)**                   | The editor can only have one truth — markers, fixes, and rules must be coherent for one rule set at a time. Multi-provider would create contradictory markers and unfixable states. |
| **Monaco editor**                                      | Professional editing experience, JSON syntax highlighting, built-in undo stack.                                                                                                  |
| **Schema rule set data model**                         | Rule sets with identical schema semantics are a sound abstraction. Just needs better presentation.                                                                                |
| **Auto-fix logic** (`ruleSetFixer.ts`)                  | The fix engine is solid — handles root type, composition, keywords, additionalProperties, required, formats.                                                                     |
| **Client-side validation** (`ruleSetValidator.ts`)    | Fast, comprehensive, no auth required.                                                                                                                                           |
| **Feedback widget**                                    | Clean, non-intrusive, covers bug/feature/general.                                                                                                                                |
| **`/models` comparison page**                          | Good reference content with detailed GroupCards.                                                                                                                                 |

---

## 3. Identified Issues

### P0 — Broken / Misleading

| #   | Issue                                                                                                                                                                                                              | Where                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| 3.1 | **"Issues & Auto-Fix" sidebar section never populates.** Always shows "Paste or edit a schema to see validation results." The markers exist in the editor but are never fed into this section. Misleading dead UI. | `RightPane.tsx` L265-269 |
| 3.2 | **"No issues found" renders as error toast.** `setError("No issues found — schema is already compliant")` — success state displayed as a red error banner.                                                         | `page.tsx` L139-142      |
| 3.3 | **Error toast never dismisses.** No `×` button, no `setTimeout`. Stays on screen forever until next state change.                                                                                                  | `page.tsx` L400-407      |
| 3.4 | **No way to save/export/copy the schema.** The whole point is to produce a working schema, but there's no Copy, Download, or Share button. User must manually select-all + copy.                                   | `page.tsx`               |

### P1 — Major UX gaps

| #    | Issue                                                                                                                                                                                                 | Where                               |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 3.5  | **No landing experience.** First-time visitor sees an editor with a trivial default schema, no explanation, no examples. Value proposition is a small subtitle easily missed.                         | `page.tsx` L30-38                   |
| 3.6  | **Rule sets are unexplained.** Users think "I use GPT-4o" — no indication of what a "rule set" is, why models are grouped, or which to pick. Tooltip is `title` attr (poor UX, no mobile). | `page.tsx` L248-263                 |
| 3.7  | **No marker summary or navigation.** User sees squiggles but no count ("3 errors"), no list to click through. Must scroll and spot them manually in long schemas.                                     | `SchemaEditor.tsx`                  |
| 3.8  | **No per-issue fix.** Auto-fix is all-or-nothing: click button → diff view replaces editor → accept/reject entire batch. No way to fix one issue at a time.                                           | `page.tsx` L123-154, L289-343       |
| 3.9  | **No undo after accepting auto-fix.** `handleAcceptSuggestion` replaces state. Browser undo won't help — it's a React state replacement, not a Monaco edit.                                           | `page.tsx` L156-165                 |
| 3.10 | **Validation results modal blocks the schema.** Can't see schema while reviewing what went wrong. Results vanish on close — no history.                                                               | `page.tsx` L409-427                 |
| 3.11 | **Auth surprise.** Google sign-in popup appears with no warning when clicking "Server Validation." No explanation of why auth is needed.                                                              | `page.tsx` L98, `useAuth.ts` L43-53 |
| 3.12 | **No schema persistence.** Close the tab → everything is lost. No localStorage, no URL state, no history.                                                                                             | —                                   |

### P2 — Polish / nice-to-have

| #    | Issue                                                                                                                                           | Where               |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 3.13 | No example schemas beyond the trivial default.                                                                                                  | `page.tsx` L30-38   |
| 3.14 | No shareable URLs (schema + rule set in URL).                                                                                                   | —                   |
| 3.15 | Button label "Server Validation" is jargon.                                                                                                     | `page.tsx` L362     |
| 3.16 | Sidebar is information overload — 7 collapsible sections of dense reference. Best Practices (most actionable) is collapsed by default.          | `RightPane.tsx`     |
| 3.17 | Terminology is JSON-Schema-expert-level throughout ("additionalProperties", "Hard Constraints", "Quantitative Limits", "Composition keywords"). | various             |
| 3.18 | Upload affordance is non-standard — "Drop or upload file, paste or edit JSON" is clickable text that doesn't look clickable.                    | `page.tsx` L269-275 |
| 3.19 | Mobile responsiveness is poor (editor + sidebar layout is desktop-only).                                                                        | —                   |
| 3.20 | No clear/reset button to start fresh.                                                                                                           | —                   |

---

## 4. Proposed Layout

### Main page (`/`)

```
┌──────────────────────────────────────────────────────────────┐
│  Header: Strictly Structured by Codygo                       │
│      [Models Reference] [Use in your IDE ▾] [Feedback] [👤] │
├──────────────────────────────────────────────────────────────┤
│  Target bar (single-select, improved presentation)           │
│  Validate for:  (●) OpenAI GPT  ( ) Anthropic Claude  ( ) Google Gemini │
│  Models: gpt-4.1, gpt-4o, gpt-5, o3 + 5 more               │
├────────────────────────────────┬─────────────────────────────┤
│                                │                             │
│  Editor header                 │  Issues Panel               │
│  ┌──────────────────────────┐  │  ┌─────────────────────────┐│
│  │ Schema Editor (Monaco)   │  │  │ Summary: 3 err · 1 warn ││
│  │ • live markers (keep)    │  │  │─────────────────────────││
│  │ • drop/upload zone       │  │  │ ✕ Missing "additional…" ││
│  │                          │  │  │   Line 2  [Fix]         ││
│  │                          │  │  │ ✕ "count" not required  ││
│  │                          │  │  │   Line 5  [Fix]         ││
│  │                          │  │  │ ⚠ format "email" N/A    ││
│  │                          │  │  │   Line 8  [Details ▾]   ││
│  │                          │  │  │                         ││
│  │                          │  │  │ ▸ View full rules for   ││
│  └──────────────────────────┘  │  │   OpenAI GPT             ││
│                                │  └─────────────────────────┘│
├────────────────────────────────┴─────────────────────────────┤
│  Action bar                                                  │
│  [⎘ Copy] [↓ Download] [🔗 Share]  |  [Fix All (3)] [Test with Real APIs] │
└──────────────────────────────────────────────────────────────┘
```

### Key structural changes from current

| Area           | Current                                             | Proposed                                                                                                                         |
| -------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Header nav     | "Validator \| Why use this? \| Model support"       | "Models Reference \| Use in your IDE ▾ \| Feedback" (Validator is home, Why absorbed, integrations promoted)                     |
| Target bar     | Abstract group buttons with no explanation          | Same buttons but with provider name prefix, model list shown, short explanation                                                  |
| Right pane     | Static reference (7 collapsible sections)           | **Issues Panel** — live list of current markers + fix actions. Reference content moved to expandable "View full rules" at bottom |
| Below editor   | Two buttons inline: "Server Validation", "Auto-fix" | **Action bar** — Copy, Download, Share, Fix All, Test with Real APIs                                                             |
| Error feedback | Single red toast, no dismiss, used for success too  | Typed feedback: success banner (green), operational error (dismissible toast), validation state (in Issues Panel)                |
| Results        | Modal overlay, blocks schema, ephemeral             | Inline in Issues Panel, schema stays visible, persistent until cleared                                                           |

---

## 5. Component-Level Changes

### 5.1. `SiteHeader.tsx` — Simplify nav + add integrations

**Current**: Links for Validator (active state), "Why use this?", "Model support", Feedback, avatar.

**Proposed**:

- Remove "Validator" nav link — clicking the title/logo goes home
- Remove "Why use this?" link — content absorbed into landing state
- Rename "Model support" → "Models Reference"
- **Add "Use in your IDE" dropdown** (`IntegrationsDropdown.tsx`) — links to MCP Server and Cursor Skill setup
- Keep Feedback link and avatar
- Subtitle stays: "Validate, auto-fix, and optimize structured output schemas for any LLM"

Final nav order: `[Models Reference]  [Use in your IDE ▾]  [Feedback]  [👤]`

### 5.2. Model bar (`page.tsx` inline) — Better presentation

**Current**: Row of buttons with `displayName` only. Tooltip via `title` attr shows models.

**Proposed changes** (keep single-select radio behavior):

- **Button label**: `[ProviderIcon] Provider Family` — short, broad names derived from `provider` + family prefix of `displayName`:
  - e.g. `[🟢] OpenAI GPT`  `[🟣] Anthropic Claude`  `[🔵] Google Gemini`
  - Current data `displayName` values are "GPT (4+, o1+)", "Claude (4.5+)", "Gemini (2.5+)" — these version suffixes can go in the subtitle or tooltip, not the button label
  - If/when more rule sets are added per provider (e.g., a separate "GPT-3.5" rule set), the suffix disambiguates: "OpenAI GPT (4+)" vs "OpenAI GPT (3.5)"
- **Subtitle below selected button**: "Applies to: gpt-4.1, gpt-4o, gpt-5, o3 + 5 more" (truncate with `+ N more` if > 3-4 models, expand on click/hover)
- First-visit hint text above the bar: "Choose which provider to validate against"
- Consider a small `(?)` icon that explains: "Models within a group have identical schema rules — they differ only in performance and pricing"

### 5.3. `RightPane.tsx` → `IssuesPanel.tsx` — The biggest change

**Current**: Static reference content — Description, Hard Constraints, Supported/Unsupported Keywords, Limits, Behaviors, Best Practices, dead "Issues & Auto-Fix" section.

**Proposed**: A live **issues list** as the primary content, with reference as secondary.

#### Panel states:

**State A — Empty / landing** (no schema or default untouched):

```
Paste or write a JSON Schema in the editor.
We'll validate it against [selected rule set]'s rules in real time.

Or try an example:
[Simple object]  [Nested schema]  [Union types]
```

**State B — Has issues** (the primary state):

```
3 errors · 1 warning
for OpenAI GPT
─────────────────────────────
✕ Missing "additionalProperties": false
  Objects must explicitly disallow extra fields for this provider.
  ⤷ Line 2  [Fix]

✕ "count" not in "required" array
  All properties must be listed in "required" for OpenAI.
  The fix adds it to required and makes the type nullable.
  ⤷ Line 5  [Fix]

⚠ format "email" not supported
  Supported formats: date-time, date. The format value
  will be moved to the description as a hint.
  ⤷ Line 8  [Fix]

─────────────────────────────
▸ View full rules for OpenAI GPT
  (expands to current RightPane reference content)
```

**State C — All clear**:

```
✓ Schema is valid for OpenAI GPT

Ready to use with: gpt-4.1, gpt-4o, gpt-5, o3 + 5 more  [show all]

Want to be sure? Test with the real API endpoint.
[Test with Real APIs]
```

**State D — API test results** (shown at top of panel, above issues):

```
API Test Results
─────────────────
✓ gpt-4.1         234ms
✓ gpt-4o          189ms
✕ gpt-5           412ms
  "properties exceeds max nesting depth of 5"
(+ 6 more — all passed)  [show all]

[Re-test]  [Clear results]
─────────────────
(issues list continues below)
```

#### Data flow:

- `SchemaEditor` already produces `SchemaMarker[]` via `validateSchemaForRuleSet`
- Currently these markers are only set on the Monaco model
- **Proposed**: Also pass the `SchemaMarker[]` up to the parent (`page.tsx`) via callback
- `page.tsx` passes them as a prop to `IssuesPanel`
- `IssuesPanel` renders each marker as an issue card
- Each card's `[Fix]` button calls a per-marker fix function (see 5.5)
- Clicking the line number reference focuses the editor on that line

#### Reference content (collapsed):

- "View full rules" expands to show the current `RightPane` reference sections
- This content is unchanged — just repositioned as secondary/expandable
- Best Practices section should be promoted higher in this list or shown as tips within the relevant issue cards

### 5.4. `page.tsx` — Action bar (new section at bottom)

**Current**: "Server Validation" and "Auto-fix" buttons inline below the editor.

**Proposed**: A persistent action bar at the bottom of the page:

```
[⎘ Copy]  [↓ Download .json]  [🔗 Share Link]  ║  [Fix All (3)]  [Test with Real APIs]
```

| Button                  | Behavior                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Copy**                | `navigator.clipboard.writeText(schema)` → brief "Copied!" feedback (inline text change or tooltip, not a toast) |
| **Download**            | Create Blob, trigger download as `schema.json`                                                                  |
| **Share Link**          | Encode schema + rule set in URL hash. For schemas > ~8KB: "Schema too large for URL — copied without schema"       |
| **Fix All (N)**         | Apply all auto-fixable changes. Show summary banner above editor (see 5.5). Disabled/hidden when 0.             |
| **Test with Real APIs** | Was "Server Validation". See 5.6.                                                                               |

### 5.5. Auto-fix redesign

**Current**: "Auto-fix" button → `fixSchemaForRuleSet` runs → if fixes exist, editor is **replaced** with DiffEditor → user accepts/rejects entire batch → state replacement (no undo).

**Problems with current**:
- Editor is replaced — user loses editing context
- All-or-nothing accept/reject — no partial fixes
- No undo after accepting (React state replacement, not Monaco edit)
- But: the diff view itself is valuable for reviewing changes — don't lose that

**Proposed: three fix paths + diff review**

#### Path A: Monaco Quick Fix (primary — inline, per-issue)

Use Monaco's **Code Action / Quick Fix** system — the standard IDE pattern. When a marker has an associated fix:

- A **lightbulb icon** appears in the gutter next to the error line
- User hovers the squiggly → sees error message → clicks "Quick Fix..." (or presses `Cmd+.` / `Ctrl+.`)
- A dropdown shows the available fix: e.g. `Add "additionalProperties": false`
- User clicks the fix → Monaco applies the edit → lands on the **undo stack** automatically
- Marker re-evaluates and disappears

This is the pattern every developer already knows from VS Code. It's discoverable via hover, lightbulb, and keyboard shortcut.

**Implementation**: Register a `CodeActionProvider` on the Monaco editor model. When Monaco requests code actions for a range:
1. Check if any `SchemaMarker` in that range has a corresponding fix from `ruleSetFixer.ts`
2. Compute the text edit (the specific text replacement in the JSON)
3. Return a `CodeAction` with a `WorkspaceEdit` describing the change
4. Monaco handles applying it, undo stack, and marker refresh

**Correlating markers ↔ fixes**: Both the validator (`ruleSetValidator.ts`) and fixer (`ruleSetFixer.ts`) work off JSON pointers and `kind` identifiers. The correlation path:
- Validator produces `SchemaMarker[]` with line/col positions and messages
- Fixer produces `AppliedFix[]` with JSON pointers and fix kinds
- Match by pointer: the marker's position maps to a JSON pointer (via `json-source-map`), and the fixer operates on the same pointer
- Attach the fix's `WorkspaceEdit` to each marker that has a corresponding `AppliedFix`

#### Path B: Issues Panel [Fix] buttons (secondary — list navigation)

Each issue card in the Issues Panel still has a `[Fix]` button for users who prefer navigating the list:
- Clicking `[Fix]` applies the same edit as the Monaco Quick Fix
- Applied as a Monaco edit operation → undo stack → Ctrl+Z works
- The issue transitions: strikethrough → fades out → removed
- This is a convenience for users scrolling through the issues list

#### Path C: Fix All + Diff Review (batch — from Action Bar)

User clicks `[Fix All (N)]` in the Action Bar. This is a two-step flow: **review → apply**.

**Step 1 — Diff review modal**:

A modal/drawer opens showing the diff **without replacing the editor**:

```
┌──────────────────────────────────────────────────────────────┐
│  Review Changes (3 fixes for OpenAI GPT)            [×]     │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  ┌─────────────────────────┬────────────────────────────┐   │
│  │  Original               │  Fixed                      │   │
│  │  {                      │  {                          │   │
│  │    "type": "object",    │    "type": "object",        │   │
│  │    "properties": {      │    "properties": {          │   │
│  │      "name": {          │      "name": {              │   │
│  │        "type": "string" │        "type": "string"     │   │
│  │      }                  │      },                     │   │
│  │    }                    │      "count": {             │   │
│  │  }                      │        "type": ["integer",  │   │
│  │                         │                 "null"]     │   │
│  │                         │      }                      │   │
│  │                         │    },                       │   │
│  │                         │    "required": ["name",     │   │
│  │                         │                "count"],    │   │
│  │                         │    "additionalProperties":  │   │
│  │                         │      false                  │   │
│  │                         │  }                          │   │
│  └─────────────────────────┴────────────────────────────┘   │
│                                                              │
│  Changes:                                                    │
│  + Added "additionalProperties": false                       │
│  + Added "count" to "required", made nullable                │
│  ~ "oneOf" → "anyOf": exclusivity constraint now a hint      │
│  ! 1 issue cannot be auto-fixed (manual attention needed)    │
│                                                              │
│  [Apply All]  [Cancel]                                       │
└──────────────────────────────────────────────────────────────┘
```

**Step 2 — Apply**:

- User clicks `[Apply All]` → changes are applied to the editor as a **single Monaco edit group** (one undo operation)
- A banner appears above the editor:

```
┌──────────────────────────────────────────────────────────────┐
│  ✓ 3 fixes applied · [Undo]  [Dismiss]                      │
│  ! 1 issue requires manual attention                         │
└──────────────────────────────────────────────────────────────┘
```

- `[Undo]` triggers Monaco undo (reverts all fixes in one step)
- Trade-off warnings (`infoLost` from `AppliedFix`) visible in the diff review modal, and summarized in the banner

**Skip review option**: For power users, the Action Bar could also offer a keyboard shortcut or modifier-click to apply all fixes directly without the diff modal (e.g., `Shift+Click` on Fix All = apply immediately).

#### Keeping the DiffEditor component

The `DiffEditor` from `@monaco-editor/react` is **kept** but relocated — it moves from replacing the main editor (current) to living inside the Fix All review modal. This preserves the ability to review changes while keeping the main editor always accessible.

#### Change history (future enhancement)

A lightweight change log that records each fix applied (timestamp, fix kind, pointer, description). Accessible via a "History" toggle in the Issues Panel. Useful for:
- Reviewing what was changed in the current session
- Understanding the cumulative effect of multiple individual fixes
- Not essential for initial implementation — mark as future

### 5.6. "Test with Real APIs" (replaces Server Validation modal)

**Current**: Click "Server Validation" → surprise auth popup → loading button text → results in modal overlay (blocks schema) → close modal, results gone.

**Proposed**:

#### Pre-auth:

When user clicks "Test with Real APIs" while not authenticated, show an **inline auth prompt in the Issues Panel** (not a surprise popup):

```
┌─────────────────────────────────┐
│  Sign in to test with real APIs │
│                                 │
│  We call the actual provider    │
│  endpoint with your schema.     │
│  Sign-in prevents abuse.        │
│                                 │
│  [Sign in with Google]          │
│                                 │
│  No data is stored.             │
└─────────────────────────────────┘
```

#### During validation:

Loading state in the Issues Panel (skeleton or spinner per model):

```
  Testing with real APIs…
  gpt-4.1         ◌
  gpt-4o          ◌
  gpt-5           ◌
  (+ 6 more models…)
```

#### Results:

Inline at the top of the Issues Panel (see State D above). Schema remains visible and editable. `[Re-test]` button for quick iteration.

### 5.7. Error handling — replace single toast

**Current**: One `error` state → red fixed-position div, no dismiss, no auto-clear, used for both errors and "no issues found" success.

**Proposed three feedback types**:

| Type                  | Treatment                                    | Example                                    |
| --------------------- | -------------------------------------------- | ------------------------------------------ |
| **Validation state**  | In Issues Panel (State B or C)               | "3 errors for OpenAI" or "Schema is valid" |
| **Success feedback**  | Green inline banner, auto-dismiss 5s         | "Schema copied!" or fix summary            |
| **Operational error** | Dismissible toast with `×` + auto-dismiss 8s | "Network error", "Auth failed"             |

Remove `setError("No issues found — schema is already compliant")` — this becomes the Issues Panel State C (valid schema, green checkmark).

### 5.8. Persistence (new)

#### localStorage auto-save

On every schema change (debounced ~1s):

```ts
localStorage.setItem("ssv:schema", schema);
localStorage.setItem("ssv:ruleSetId", selectedRuleSetId);
```

On page load:

```ts
const saved = localStorage.getItem("ssv:schema");
if (saved) {
  setSchema(saved);
  // show subtle indicator: "Restored from last session · [Start fresh]"
}
```

#### URL state

Encode selected rule set in URL params: `?ruleSet=openai-gpt41`
Optional: encode schema in URL hash for sharing (with length guard).

### 5.9. Landing state (first visit)

**Current**: Editor loads with a trivial default schema, no explanation.

**Proposed**: On first visit (detected via `localStorage('ssv:hasVisited')`), the **full main area** (editor + sidebar) is replaced with a landing view. The header and model bar are still visible but the model bar is inactive/dimmed until the user reaches the editor.

The landing view combines provider selection, schema input, and guidance into a single view — no wizard, no slides, but clearly sequenced:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   Validate JSON Schemas for LLM Structured Output            │
│                                                              │
│   Each provider (OpenAI, Anthropic, Google) supports a       │
│   different subset of JSON Schema. This tool checks your     │
│   schema, shows issues, and fixes them automatically.        │
│                                                              │
│   ─────────────────────────────────────────────────────────  │
│                                                              │
│   ① Choose your provider                                     │
│                                                              │
│   ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│   │ [🟢] OpenAI GPT │ │ [🟣] Anthropic   │ │ [🔵] Google  │ │
│   │                 │ │      Claude      │ │     Gemini   │ │
│   │ gpt-4.1, gpt-4o│ │ claude-sonnet-   │ │ gemini-2.5-  │ │
│   │ gpt-5, o3      │ │ 4.5, opus-4.5   │ │ pro, flash   │ │
│   │ + 5 more       │ │ + 2 more        │ │ + 3 more     │ │
│   └─────────────────┘ └──────────────────┘ └──────────────┘ │
│                                                              │
│   ② Paste or upload your schema                              │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                      │   │
│   │  Paste a JSON Schema here, drop a .json file,        │   │
│   │  or upload                                           │   │
│   │                                                      │   │
│   │              [Upload File]                           │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   Or try an example:                                         │
│   [Simple object]  [Nested schema]  [Union types]            │
│   [With enums]     [Real-world API response]                 │
│                                                              │
│   ─────────────────────────────────────────────────────────  │
│                                                              │
│   Also available as an MCP server or Cursor skill.           │
│   [Learn more →]                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Behavior**:
- Provider cards are selectable (radio) — clicking one highlights it and pre-selects that rule set for the editor
- The paste area is always active — user can paste before or after picking a provider
- Once the user **both** selects a provider **and** provides a schema (paste / upload / example), the landing dissolves into the editor with that provider active
- If user only pastes without picking a provider: prompt "Which provider?" briefly, or fall back to the first provider with a subtle note "Validating for OpenAI GPT (change anytime in the bar above)"
- Example schemas can auto-select a provider if they're provider-specific (e.g., "OpenAI-compatible schema" selects OpenAI)
- Set `localStorage('ssv:hasVisited', 'true')` on dissolution
- Returning users go straight to the editor (or restored session)

**Why this is better than a wizard/slide**:
- Everything is visible at once — user can scan the whole flow in one glance
- No "next" buttons or pagination
- The numbered steps (①, ②) provide sequence without enforcing it
- Provider selection doubles as education — the cards briefly show what models are in each rule set

This absorbs the key content from `/why` so that page can be removed.

### 5.10. Help / Flow guidance

**Current**: No help, no flow guidance, no (?) icon. A new user must figure out the tool by trial and error.

**Proposed**: Two layers of guidance — one passive, one on-demand.

#### Layer 1: "How it works" strip (passive, on landing)

A minimal 3-step visual on the landing page, between the value prop and the provider cards:

```
How it works:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ ① Choose    │ →  │ ② Paste     │ →  │ ③ Fix &     │
│   provider  │    │   schema    │    │   export    │
└─────────────┘    └─────────────┘    └─────────────┘
```

This sets expectations before the user does anything. It dissolves with the landing state and doesn't reappear.

#### Layer 2: (?) Help button (on-demand, always available)

A small `(?)` icon in the header (next to Feedback or in the far right). Clicking it opens a lightweight overlay or dropdown showing:

```
┌──────────────────────────────────────────┐
│  Quick Guide                       [×]   │
│──────────────────────────────────────────│
│                                          │
│  ① Pick a provider from the bar above   │
│     Each has different schema rules.     │
│                                          │
│  ② Write or paste your JSON Schema      │
│     Issues appear as squiggly underlines │
│     in the editor — hover to read them.  │
│                                          │
│  ③ Fix issues                            │
│     • Hover a squiggly → Quick Fix       │
│     • Or click [Fix All] at the bottom   │
│     • Review changes in the diff view    │
│                                          │
│  ④ Export                                │
│     [Copy] [Download] [Share] in the     │
│     bottom bar.                          │
│                                          │
│  ⑤ Test with real APIs (optional)        │
│     Sends your schema to the actual      │
│     provider endpoint to verify.         │
│                                          │
│  ─────────────────────────────────────── │
│  💡 Also available as MCP server or      │
│     Cursor skill. [Use in your IDE ▾]    │
└──────────────────────────────────────────┘
```

**Key design decisions**:
- It's a **reference**, not a tutorial — no step-by-step walkthrough that blocks the UI
- It covers all the flows concisely: validate, fix (both individual and batch), export, API test
- Mentions the squiggly → Quick Fix pattern explicitly (since this is the primary fix path and might not be obvious)
- Includes a nudge to MCP/skill at the bottom
- Always accessible, never intrusive
- Could also have a "Don't show on startup" checkbox if it auto-opens on first visit after landing dissolves

---

## 6. New Components

| Component            | Purpose                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IssuesPanel.tsx`    | Replaces `RightPane.tsx` as right sidebar. Receives `SchemaMarker[]` + fix info as props. Renders issue list, summary, fix buttons, expandable reference. |
| `ActionBar.tsx`      | Persistent bottom bar with Copy, Download, Share, Fix All, Test with Real APIs buttons.                                                                   |
| `IssueSummary.tsx`   | Header for Issues Panel showing error/warning count.                                                                                                      |
| `IssueCard.tsx`      | Single issue: severity icon, message, line reference (clickable), [Fix] button, expandable details.                                                       |
| `ApiTestResults.tsx` | Inline results section for "Test with Real APIs" showing per-model pass/fail/latency.                                                                     |
| `FixBanner.tsx`      | Banner above editor after Fix All: summary of applied fixes, trade-offs, [Undo] button.                                                                   |
| `LandingState.tsx`   | First-visit view with provider selection cards, paste/upload area, examples, value prop, and "How it works" strip.                                        |
| `HelpOverlay.tsx`    | (?) help button + dropdown/overlay showing the quick guide (5-step flow reference). Always accessible from header.                                        |
| `Toast.tsx`          | Generic dismissible toast with auto-dismiss timer and `×` button. Replace the current fixed error div.                                                    |
| `IntegrationsDropdown.tsx` | Header dropdown — "Use in your IDE" with MCP Server + Cursor Skill setup links. |
| `IntegrationCTA.tsx` | Reusable dismissible CTA block for promoting MCP/skill. Used in success state, fix banner, landing. Respects localStorage suppression. |

---

## 7. Promoting MCP & Skill Integrations

### The funnel

The web tool is top-of-funnel — developers discover "Strictly Structured" here. The MCP server and skill are the retention play — they embed validation into the developer's daily workflow so they never need to context-switch to a browser.

```
Discovery (web tool)  →  Value moment (validates/fixes schema)  →  Conversion (install MCP/skill)
```

The promotion should be **contextual, not intrusive** — surface the integrations at the moment the user has gotten value, not before.

### Placement strategy

There are four touchpoints, ordered from subtle to prominent. None should feel like an ad — they should feel like a natural "you can also do this in your editor" nudge.

#### Touchpoint 1: Header integration links (always visible, subtle)

Add a small "Use in your IDE" link/dropdown in the header, alongside Feedback and avatar:

```
Strictly Structured    [Models Reference]  [Use in your IDE ▾]  [Feedback]  [👤]
```

The dropdown shows:

```
┌────────────────────────────────────────┐
│  Use in your IDE                       │
│────────────────────────────────────────│
│                                        │
│  MCP Server                            │
│  For Cursor, Claude Desktop, or any    │
│  MCP-compatible tool.                  │
│  Tools: validate, fix, list groups     │
│  [Setup instructions →]               │
│                                        │
│  Cursor / Claude Code Skill            │
│  Conversational schema validation      │
│  right in your editor.                 │
│  [Install skill →]                    │
│                                        │
│────────────────────────────────────────│
│  📦 npm: @ssv/mcp-server              │
└────────────────────────────────────────┘
```

This is always available but never blocks the core flow. Developers who are already looking for integrations will find it.

#### Touchpoint 2: Success state CTA (contextual, after value)

When the Issues Panel shows "✓ Schema is valid" (State C), include an integration nudge below the export actions:

```
┌─────────────────────────────────────┐
│  ✓ Schema is valid for OpenAI GPT    │
│                                     │
│  [⎘ Copy]  [↓ Download]            │
│                                     │
│  ─────────────────────────────────  │
│  💡 Validate schemas without        │
│     leaving your editor             │
│                                     │
│  [Set up MCP Server]                │
│  [Install Cursor Skill]             │
│                                     │
│  Works with Cursor, Claude Desktop  │
└─────────────────────────────────────┘
```

This is the highest-intent moment — the user just got value and is thinking "I want this in my workflow." The CTA should be **dismissible** (show a `×` or "Don't show again" that persists to localStorage).

#### Touchpoint 3: Landing state mention (first visit)

In the landing/empty state, mention the integrations as part of the value proposition:

```
Each LLM provider supports a different subset of JSON Schema.
This tool checks your schema works and fixes issues automatically.

Available here, as an MCP server, or as a Cursor skill.
[Learn more →]
```

Brief, not the focus. The user hasn't gotten value yet, so this is just awareness.

#### Touchpoint 4: Post-fix banner (after Fix All)

After the user applies Fix All and the `FixBanner` shows the summary, add a subtle line:

```
┌──────────────────────────────────────────────────────────────┐
│  ✓ 3 fixes applied · [Undo]  [Dismiss]                      │
│                                                              │
│  Tip: Get auto-fix in your editor → [MCP Server] [Skill]    │
└──────────────────────────────────────────────────────────────┘
```

### Setup/install pages

The integration links should lead to a setup guide. Two options:

**Option A: Dedicated `/integrations` page** (recommended)

A new page with clear setup instructions for each channel:

```
/integrations

# Use Strictly Structured in Your Editor

## MCP Server
Validate, fix, and inspect schemas from any MCP-compatible tool.

### Quick setup (Cursor)
1. Install: npm install -g @ssv/mcp-server
2. Add to Cursor MCP config:
   {
     "mcpServers": {
       "ssv": { "command": "ssv-mcp-server" }
     }
   }
3. Available tools: validate_schema, fix_schema, list_groups

### Quick setup (Claude Desktop)
1. ...

## Cursor Skill
Conversational schema validation — just ask your AI assistant.

### Install
1. Copy the skill to .cursor/skills/validate-schema/
2. Ask: "Validate my schema for OpenAI"
```

**Option B: External links** (simpler)

Link to the GitHub README or npm page for each package. Less control over the experience but zero frontend work.

Recommendation: Start with **Option B** (link to GitHub README), upgrade to **Option A** after the core redesign ships.

### Suppression & frequency

- **Header dropdown**: Always visible, no suppression needed (it's navigation, not a prompt)
- **Success state CTA**: Dismissible via `×` → sets `localStorage('ssv:hideIntegrationCTA')`. Show at most once per session if not dismissed permanently.
- **Landing state mention**: Shows only on first visit (already controlled by `ssv:hasVisited`)
- **Post-fix banner tip**: Shows only on first Fix All (controlled by `localStorage('ssv:shownFixTip')`)

### Component

| Component | Purpose |
|-----------|---------|
| `IntegrationsDropdown.tsx` | Header dropdown with MCP + Skill setup links |
| `IntegrationCTA.tsx` | Reusable CTA block used in success state and fix banner. Dismissible, respects localStorage. |

---

## 8. Removed / Absorbed

| Current                    | Action                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/why` page                | **Remove**. Key content absorbed into `LandingState.tsx` and a brief "About this tool" section on `/models` or footer.                                                                                  |
| `RightPane.tsx`            | **Replace** with `IssuesPanel.tsx`. The reference content (constraints, keywords, limits, behaviors, best practices) moves into an expandable "View full rules" section at the bottom of `IssuesPanel`. |
| `DiffEditor` flow          | **Relocate**. DiffEditor moves from replacing the main editor to living inside the Fix All review modal. No longer blocks the editor; used for reviewing batch changes before applying.                  |
| Validation results modal   | **Remove**. Replace with inline `ApiTestResults` in `IssuesPanel`.                                                                                                                                      |
| Error toast (current)      | **Replace** with typed feedback system (`Toast.tsx` + panel states).                                                                                                                                    |
| "Server Validation" button | **Replace** with "Test with Real APIs" in `ActionBar`.                                                                                                                                                  |
| "Auto-fix" button          | **Replace** with "Fix All (N)" in `ActionBar` + per-issue [Fix] buttons in `IssuesPanel`.                                                                                                               |

---

## 9. User Journey (Redesigned)

### First visit

```
1. User lands on /
   → Sees landing view: value prop, "How it works" strip, provider cards, paste area, examples
   → (?) help button visible in header for later reference

2. Picks a provider (clicks a provider card)
   → Card highlights, rule set pre-selected

3. Pastes schema (or picks example, or uploads file)
   → Can happen before or after step 2 — order doesn't matter
   → If user pastes without picking provider: defaults to first, with a note

4. Once both provider + schema are provided:
   → Landing dissolves, editor activates with that provider's rules
   → Model bar shows the selected provider as active
   → localStorage flag set — landing won't show again
```

### Core loop

```
5. User can change provider anytime from the model bar
   → Bar shows provider name, rule set name, model list
   → Editor markers re-evaluate immediately

6. Issues Panel populates with live issues from the editor markers
   → Summary: "3 errors · 1 warning for OpenAI GPT"
   → Each issue: plain message, line ref (clickable), [Fix] button
   → (?) help overlay accessible if user needs guidance

7. User fixes issues:
   a. Hover squiggly → Quick Fix (lightbulb / Cmd+.) → Monaco applies edit → Ctrl+Z to undo
   b. Click [Fix] in Issues Panel → same Monaco edit path
   c. Click [Fix All (N)] in action bar → diff review modal → [Apply All] → undoable
   → Issues list updates in real-time as markers re-evaluate

8. Issues reach 0 → Panel shows "✓ Schema is valid for OpenAI GPT"
   → Suggests: "Test with real APIs" and export actions
```

### Verification (optional)

```
9. User clicks [Test with Real APIs]
   → If not authed: inline auth prompt (not surprise popup)
   → Loading state in Issues Panel per model
   → Results inline: pass/fail/latency per model
   → Schema stays visible, [Re-test] available
```

### Export

```
10. User exports the result
    → [Copy] → clipboard + "Copied!" feedback
    → [Download .json] → file download
    → [Share Link] → URL with rule set + schema encoded
```

### Integration discovery

```
11. After getting value (schema validated or fixed), user sees contextual CTA:
    → "Validate schemas without leaving your editor"
    → [Set up MCP Server]  [Install Cursor Skill]
    → Dismissible — respects localStorage, not pushy
    → Links to /integrations page or GitHub README

12. User can also find integrations anytime via header:
    → [Use in your IDE ▾] dropdown in nav
    → Setup instructions for MCP Server + Cursor Skill
```

### Persistence

```
13. User closes tab
    → Schema + rule set selection auto-saved to localStorage

14. User returns
    → "Restored from last session · [Start fresh]"
    → Picks up where they left off
```

---

## 10. Implementation Phases

### Phase 1 — Fix the broken things

**Effort**: Small · **Impact**: High

- [ ] **3.2** Fix "no issues found" — don't use `setError` for success. Show valid state appropriately.
- [ ] **3.3** Make error toast dismissible — add `×` button + `setTimeout` auto-dismiss.
- [ ] **3.4** Add Copy + Download buttons below editor (precursor to full ActionBar).
- [ ] **3.1** Wire marker results into sidebar: pass `SchemaMarker[]` from editor → parent → right pane. Show issue count + list in "Issues & Auto-Fix" section. (Minimal version of IssuesPanel within existing RightPane.)
- [ ] **3.12** Add localStorage persistence for schema + selected rule set.
- [ ] **3.20** Add a "Clear" / "Reset" button.

### Phase 2 — Issues Panel

**Effort**: Medium · **Impact**: High (transforms the experience)

- [ ] Build `IssuesPanel.tsx` to replace `RightPane.tsx`:
  - Issue list with summary, severity, messages, line refs
  - Clickable line ref → editor focus
  - Per-issue `[Fix]` buttons (secondary to Monaco Quick Fix)
  - Reference content in expandable "View full rules"
- [ ] Correlate `SchemaMarker` entries with `ruleSetFixer` fixes (match by JSON pointer/kind)
- [ ] Register Monaco `CodeActionProvider` — lightbulb + Quick Fix on markers that have associated fixes
- [ ] Individual fix path (both Quick Fix and panel [Fix] button): apply as Monaco edit operation (undo stack)
- [ ] Panel states: empty, has-issues, all-clear

### Phase 3 — Action bar + Fix All rework

**Effort**: Medium · **Impact**: High

- [ ] Build `ActionBar.tsx` with Copy, Download, Share, Fix All, Test with Real APIs
- [ ] Fix All applies changes as Monaco edit group (single undo)
- [ ] `FixBanner.tsx` — summary banner with trade-off warnings + [Undo]
- [ ] Relocate DiffEditor into Fix All review modal (diff review before apply)
- [ ] URL state encoding (rule set in params, schema in hash for sharing)

### Phase 4 — Landing state + onboarding + help

**Effort**: Small-medium · **Impact**: Medium

- [ ] Build `LandingState.tsx` — provider selection cards + paste/upload area + examples + "How it works" strip
- [ ] Provider cards on landing: show icon, name, truncated model list, selectable (pre-selects rule set for editor)
- [ ] Dissolution logic: both provider selected + schema provided → transition to editor
- [ ] Create 4-5 example schemas demonstrating common patterns and issues
- [ ] localStorage first-visit detection (`ssv:hasVisited`)
- [ ] Build `HelpOverlay.tsx` — (?) button in header, quick guide overlay with 5-step flow
- [ ] Improve model bar presentation (provider prefix, model list subtitle, explanation)
- [ ] Remove `/why` page, absorb content

### Phase 5 — Inline API testing

**Effort**: Medium · **Impact**: Medium

- [ ] Replace validation results modal with inline `ApiTestResults` in Issues Panel
- [ ] Pre-auth inline prompt instead of surprise popup
- [ ] Loading state per model
- [ ] Re-test button
- [ ] Rename "Server Validation" → "Test with Real APIs" (done in Phase 3 action bar)

### Phase 6 — Integration promotion

**Effort**: Small-medium · **Impact**: Medium (drives adoption of MCP/skill)

- [ ] Build `IntegrationsDropdown.tsx` for header nav ("Use in your IDE" dropdown)
- [ ] Build `IntegrationCTA.tsx` — reusable, dismissible CTA block
- [ ] Add integration CTA to Issues Panel success state (State C)
- [ ] Add integration mention to landing empty state
- [ ] Add integration tip to FixBanner (after first Fix All)
- [ ] Add localStorage suppression logic (`ssv:hideIntegrationCTA`, `ssv:shownFixTip`)
- [ ] Create `/integrations` page with setup instructions for MCP Server + Cursor Skill (or link to GitHub README as v1)

### Phase 7 — Terminology + polish

**Effort**: Small · **Impact**: Small-medium

- [ ] Rename "Hard Constraints" → "Requirements"
- [ ] Rename "Quantitative Limits" → "Size Limits"
- [ ] Add plain-English descriptions alongside technical keyword names
- [ ] Improve mobile responsiveness (sidebar as drawer/sheet on small screens)
- [ ] Cross-provider compatibility summary (secondary, non-editor indicator)

---

## Appendix: Terminology Reference

| Current term                       | Proposed term                                             | Reason                                           |
| ---------------------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| Schema rule set                    | (keep internally) — show as "Provider — Rule Set Name" in UI | Users think in providers, not rule sets          |
| Server Validation                  | Test with Real APIs                                       | Says what it does                                |
| Hard Constraints                   | Requirements                                              | Less intimidating                                |
| Quantitative Limits                | Size Limits                                               | Plain language                                   |
| Supported Keywords                 | Supported features                                        | Broader audience (keep keyword in parenthetical) |
| Behaviors                          | Advanced features                                         | More descriptive                                 |
| additionalProperties must be false | "No extra fields allowed beyond those you define"         | Human-readable first                             |
| Composition keywords               | "Schema composition (anyOf, allOf, …)"                    | Add actual keywords for searchability            |
