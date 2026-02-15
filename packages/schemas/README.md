# schemas

Single source of truth for schema rule sets, validation, and auto-fix logic. All consumers import directly from this package — no code generation or CLI required.

**Vocabulary:** In this repo, **schema** = a JSON Schema that describes data (what users edit and we validate). **Meta-schema** = a JSON Schema that validates other schemas (e.g. `versionAggregatedJsonSchema.json`). **Metadata** = the top-level `meta` object in the data (version, lastUpdated, etc.). See [docs/vocabulary.md](../../docs/vocabulary.md) for the full definitions.

## Exports

| Import path | What |
|-------------|------|
| `@ssv/schemas/types` | TypeScript types (`SchemaRuleSet`, `ProviderId`, etc.) |
| `@ssv/schemas/ruleSetValidator` | `validateSchemaForRuleSet(raw, ruleSet)` — provider-specific validation |
| `@ssv/schemas/ruleSetFixer` | `fixSchemaForRuleSet(schema, ruleSet)` — auto-fix engine |
| `@ssv/schemas/data/schemaRuleSets.json` | Canonical rule sets data |
| `@ssv/schemas/data/versionAggregatedJsonSchema.json` | Hybrid Draft-07/2020-12 meta-schema |

This package exports raw `.ts` source files — consumers compile them with their own build tooling.

## Data

- **data/schemaRuleSets.json** — Canonical rule set definitions (provider constraints, supported keywords, display metadata).
- **data/versionAggregatedJsonSchema.json** — Aggregated meta-schema for structural JSON Schema validation (used by Monaco and AJV).
- **data/validationSamples/** — 175 test sample schemas organized by rule set ID.

## Tests

```bash
pnpm --filter @ssv/schemas test
```

Runs `ruleSetValidator.test.ts` which loads all 175 sample schemas from `data/validationSamples/`, validates each against its rule set, and asserts expected results.
