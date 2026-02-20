# Validation Logic Reference

This document describes the validation algorithm used by the `validate.mjs` script. Use this as a reference when reasoning about schema validity without running the script.

## Rule Types

Each provider rule set in `schema_rule_sets.json` has a `validationRules` array. Each rule has:

- `path` — which nodes to check
- `check` — what to check
- `value` / `keywords` — check parameters

### Path Matching

| Path | Matches |
|------|---------|
| `$` | Root node only |
| `**` | All nodes |
| `**.object` | All nodes with `type: "object"` |
| `**.string` | All nodes with `type: "string"` |
| `**.array` | All nodes with `type: "array"` |
| `**.number` | All nodes with `type: "number"` |
| `**.integer` | All nodes with `type: "integer"` |
| `**.string.format` | String nodes that have a `format` field |

### Check Types

| Check | Behavior |
|-------|----------|
| `type_equals` | Root type must equal `value` |
| `type_in` | Root type must be in `value` array |
| `no_anyOf_at_root` | Root must not have `anyOf` |
| `has_additional_properties_false` | All objects must have `additionalProperties: false` |
| `all_properties_in_required` | All property keys must appear in `required` |
| `no_keywords` | Listed `keywords` must not appear on matched nodes |
| `no_composition` | Listed composition `keywords` must not appear |
| `value_in` | String format value must be in allowed `value` list |
| `recommend_additional_properties_false` | Warning only (skipped by strict validation) |

## Top-Level Group Fields

Beyond `validationRules`, each rule set also has:

- `rootType` — allowed root type(s)
- `rootAnyOfAllowed` — whether `anyOf` is allowed at root
- `allFieldsRequired` — whether all properties must be in `required`
- `additionalPropertiesMustBeFalse` — whether objects need `additionalProperties: false`
- `supportedTypes` — per-type keyword support
- `composition.supported` / `composition.unsupported` — which composition keywords work
- `limits` — quantitative limits (maxProperties, maxNestingDepth, etc.)

## Schema Tree Traversal

The validator walks the schema tree recursively:

1. Parse JSON and check root type
2. For each node, check all `validationRules` with matching paths
3. Recurse into: `properties`, `items`, `prefixItems`, `anyOf`, `$defs`, `additionalProperties`
4. After traversal, check quantitative limits (total properties, nesting depth, enum values)
