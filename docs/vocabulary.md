# Vocabulary: schema vs meta-schema vs metadata

This project uses three terms that must stay consistent to avoid confusion.

---

## 1. Schema

**What it is:** A JSON Schema document that **describes the shape of data** (e.g. the structure of an LLM’s structured output). It uses keywords like `type`, `properties`, `required`, `enum`, etc.

**Who uses it:** The **user** writes or pastes a schema. Our app **validates** it against provider rules and may **fix** it.

**Examples:**
- The document in the schema editor
- The string sent to `validate_schema` (MCP) or `validateSchemaForRuleSet`
- Sample files under `packages/schemas/samples/schemas/*.json` (schemas that describe example data)

**Use the word “schema” when:** Referring to the user’s JSON Schema, validation of that schema, or editing/fixing it.

---

## 2. Meta-schema

**What it is:** A JSON Schema document that **validates other schemas** (a “schema for schemas”). It defines what a valid JSON Schema document may contain.

**Standards:**
- **Aggregated meta-schema** – A hybrid Draft-07 / 2020-12 JSON Schema definition covering keywords from both drafts. Kept as `packages/schemas/data/versionAggregatedJsonSchema.json`. Used by Monaco (frontend) and AJV (MCP server) for structural validation before provider-specific checks.

**In this project:**
- The aggregated meta-schema validates that a **schema** is structurally valid JSON Schema (correct use of keywords, types, etc.).
- Provider-specific rule validation is handled by `validateSchemaForRuleSet` (custom logic in `@ssv/schemas`), which checks the schema against data-driven rules in `schemaRuleSets.json`.

**Use the word "meta-schema" when:** Referring to:
- `versionAggregatedJsonSchema.json`
- The concept of a "schema that validates other schemas"

**Do not use "meta-schema" for:** The user's schema, or the act of validating the user's schema against provider rules (that is "schema validation").

---

## 3. Metadata

**What it is:** **Data about the dataset**, not about schemas or meta-schemas. For example: version, lastUpdated, comparison columns, legend, provider badge classes.

**Where it lives:** The top-level key **`meta`** in `schemaRuleSets.json` holds this metadata. In types it appears as `SchemaRuleSetsMeta` or `data.meta`.

**Use the word “metadata” when:** Referring to that object or to “info about the rule sets dataset.” In code/comments you can say “the `meta` object” or “dataset metadata” to be explicit.

**Do not use “metadata” for:** Meta-schemas. “Meta” in **meta-schema** means “about schemas” (schema-for-schemas), not “metadata.”

---

## Quick reference

| Term        | Meaning                          | Examples |
|------------|-----------------------------------|----------|
| **schema** | JSON Schema that describes data   | User’s schema, `validate_schema` input, sample schemas |
| **meta-schema** | JSON Schema that validates schemas | `versionAggregatedJsonSchema.json` |
| **metadata** | Data about the rule sets dataset  | `schemaRuleSets.json` top-level `meta` |

---

## Naming in code and paths

- **Schema** – e.g. `validateSchemaForRuleSet`, “schema editor,” “paste a schema.”
- **Meta-schema** – e.g. `versionAggregatedJsonSchema.json`, "meta-schema validation" (validating a schema against a meta-schema).
- **Metadata** – e.g. “dataset metadata,” “the `meta` object,” `SchemaRuleSetsMeta`.
