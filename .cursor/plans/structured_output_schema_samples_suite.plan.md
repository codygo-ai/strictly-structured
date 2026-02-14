---
name: Structured Output Schema Samples Suite
overview: Exhaustive suite of JSON Schema samples keyed to structured_output_groups.json rules, with a single source of truth, maximum reuse, and minimal duplication (DRY) so the suite stays simple and strict.
todos: []
isProject: false
---

# Structured Output Schema Samples Suite (DRY + Single Source of Truth)

## Goal

Create an exhaustive, traceable suite of schema samples for every rule/feature/restriction in `structured_output_groups.json`, **with strict DRY and single source of truth at the top level**: minimal schema surface, no duplicated logic, one place that defines “what is valid for which group,” and reuse of building blocks so adding or changing rules does not multiply files or copy-paste.

---

## 1. Single source of truth (SSoT)

- **Rules and expectations**: The **only** source of “what each group allows” is `structured_output_groups.json` (its `machine` and `display` sections). The suite and any runner **derive** validity from that file; they do not re-encode the same rules in manifest text or scattered JSON.
- **Group ids**: Use exactly `group_id` from the JSON (`openai_strict`, `anthropic_structured`, `gemini_json_schema`). No aliases or duplicate lists.
- **Manifest**: The manifest lists **which sample file** and **which rule_id(s)** it targets; “expected valid/invalid per group” is **computed** by a small validator that reads the groups JSON and applies `machine.validation_rules` (and supported/unsupported keywords), not hand-written per row. So: one code path that says “for this schema + this group → valid/invalid.”
- **Schema building blocks**: One set of **minimal, reusable schema fragments** (e.g. “universal minimal object,” “object with one string enum,” “object with one number min/max”). Sample files are either:
  - **Generated** from a list of (fragment_id, variant) + rule_id, or
  - **Composed** from shared fragments (e.g. a single “base” that gets one keyword added). No copy-paste of full schemas that differ by one keyword.

---

## 2. Reuse strategy

- **Fragments over full schemas**: Define a small set of **fragment** schemas (e.g. in one `fragments.json` or one TS/JS module that exports plain objects). Each fragment is the smallest schema that demonstrates one thing (e.g. `rootObject`, `stringEnum`, `stringPattern`, `numberMinMax`, `arrayPrefixItems`). Full “samples” are either:
  - References to a fragment (e.g. `fragments.rootObject`), or
  - Fragment + single additive change (e.g. `rootObject` + `additionalProperties: true`).
- **One “universal minimal”**: A single fragment that is valid for **all** groups (root object, required, additionalProperties false, only shared keywords). All group-specific “minimal valid” samples are “universal minimal + 0 or 1 delta” or “universal minimal” itself.
- **Rule → samples mapping**: A **single table** (code or data): rule_id → list of (fragment_or_combo, variant). For example:
  - `root_type_object` → [use fragment `rootObject`],
  - `root_type_array` → [use fragment `rootArray`],
  - `string_pattern` → [use fragment `stringPattern`] (valid OpenAI, invalid others),
  - `additional_properties_false` → [use `rootObject` with `additionalProperties: false`].
  No separate “list of 60 files” maintained by hand; the list of (rule_id, fragment, variant, expected) is the single definition, and file names/paths are **generated** from that (e.g. `root_type/object.json`, `string/pattern.json`).

---

## 3. DRY and strictness

- **No duplicated “expected” logic**: Do not write “openai: valid, anthropic: invalid” in 50 places. Either:
  - The validator (reading groups JSON) computes expected per group from the schema’s keywords and structure, and the manifest only stores `rule_id` + `fragment_id` (+ optional variant), or
  - A **single matrix** (e.g. rule_id × group_id → valid/invalid) is defined once; sample files only reference rule_id.
- **Strict naming**: File paths and manifest entries are **derived** from rule_id and fragment_id (e.g. `rule_id` → `rule_id.replace(/_/g, "/") + "/" + fragment_id + ".json"`). No free-form names that can drift from the rule.
- **Single generator**: One script or module that:
  1. Reads the rule × fragment × variant table (and optionally groups JSON for validation),
  2. Writes the minimal set of schema files (one per unique fragment+variant),
  3. Writes the manifest (path, rule_ids, fragment_id, variant; expected per group from validator, not hand-typed).
  So adding a new rule = one row in the table + possibly one new fragment; no proliferation of similar files.

---

## 4. Concrete layout (minimal surface)

```
schema-samples/
  README.md                 # Purpose, how to run, that expectations are derived from groups JSON
  source/
    groups.json             # Symlink or copy of structured_output_groups.json (single SSoT)
  fragments.json            # Single file: all reusable schema fragments by id (rootObject, rootArray, stringEnum, stringPattern, ...)
  rule-matrix.json          # Single table: rule_id, fragment_id, variant?, description (expected computed by validator)
  manifest.json             # Generated: path, rule_ids, fragment_id, expected per group (from validator)
  schemas/                  # Generated: one .json per (fragment_id + variant) used in rule-matrix
    root_type/
      object.json
      array.json
    required/
      all_required.json
      optional_not_in_required.json
    ...
  validate.ts (or .js)      # One place: load groups JSON, load schema, apply machine.validation_rules + keyword checks → valid/invalid per group
  generate.ts               # One script: rule-matrix + fragments → manifest + schemas/*.json
```

- **fragments.json**: ~15–25 small schemas (e.g. root object, root array, object with one string enum, object with pattern, object with format, number min/max, array items only, array prefixItems, anyOf nested, $ref+$defs, nullable type array, allOf, oneOf, minLength, etc.). Each has a stable `id`.
- **rule-matrix.json**: One row per (rule_id, fragment_id, variant). Variant can be a small override (e.g. `additionalProperties: true`). Description is one line. No “expected” column—that comes from `validate.ts` + groups JSON.
- **validate.ts**: Inputs: schema (object), group_id. Logic: from groups JSON for that group, apply root type check, root anyOf check, required check, additionalProperties check, then walk schema and check every keyword against that group’s supported/unsupported lists. Return `{ valid: boolean }` per group. This is the **only** place that encodes “how to decide valid/invalid.”
- **generate.ts**: Reads fragments + rule-matrix; for each row, resolves schema (fragment + variant); runs validate for each group; writes `schemas/<rule_id>/<fragment_id>.json` (or similar) and appends to manifest (path, rule_ids, fragment_id, expected from validate). So manifest is always in sync with the validator and groups JSON.

---

## 5. Exhaustive coverage (unchanged intent, less duplication)

Categories and rule_ids stay as in the original plan (root type, root anyOf, required, additionalProperties, string/*, number/*, integer/*, array/*, object/*, composition/*, nullable, recursive, limits_openai, combined, title, finetuned). The difference:

- Each category is implemented as **rows in rule-matrix** pointing at **fragments** (and optional variants), not as 60+ hand-written full schemas.
- “Combined” samples (e.g. openai_full_compliant) are **one fragment** that composes multiple features; no duplicate copy of the same structure elsewhere.
- Limits (depth, property count, enum count) can be one fragment each with a **variant** (e.g. depth=10 vs depth=11); the same fragment logic, different param.

---

## 6. Traceability (preserved)

- **Rule → file**: manifest (and file path) are generated from rule_id + fragment_id, so every file is traceable to a rule.
- **Model relevance**: Group ids in the manifest come from groups JSON; group_id maps to models in the same file. So “relevance to models” is traceable via group_id → groups[].models.
- **What it checks**: Each manifest entry has rule_ids and fragment_id; the description in rule-matrix explains intent. No need to infer from file content.

---

## 7. Summary

- **Single source of truth**: `structured_output_groups.json` for rules; one `validate.ts` that computes valid/invalid per group; one `rule-matrix.json` + `fragments.json` for what to emit.
- **Reuse**: Small set of fragments; samples are fragment + optional variant; “universal minimal” is one fragment reused everywhere it applies.
- **DRY**: No hand-written expected values per sample; no copy-paste of nearly identical schemas; manifest and schema files generated from rule-matrix + fragments.
- **Simplicity and strictness**: One generator, one validator, one rule-matrix; adding a rule = one row (+ one fragment if new). File count stays on the order of the number of **unique** (fragment, variant) pairs, not “one file per rule × group combination.”
