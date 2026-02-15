# Vocabulary: schema vs meta-schema vs metadata

This project uses three terms that must stay consistent to avoid confusion.

---

## 1. Schema

**What it is:** A JSON Schema document that **describes the shape of data** (e.g. the structure of an LLM’s structured output). It uses keywords like `type`, `properties`, `required`, `enum`, etc.

**Who uses it:** The **user** writes or pastes a schema. Our app **validates** it against provider rules and may **fix** it.

**Examples:**
- The document in the schema editor
- The string sent to `validate_schema` (MCP) or `validateSchemaForRuleSet`
- Sample files under `samples/schemas/*.json` (they are schemas that describe example data)

**Use the word “schema” when:** Referring to the user’s JSON Schema, validation of that schema, or editing/fixing it.

---

## 2. Meta-schema

**What it is:** A JSON Schema document that **validates other schemas** (a “schema for schemas”). It defines what a valid JSON Schema document may contain.

**Standards:**
- **Draft-07 meta-schema** – The official JSON Schema draft-07 definition. We keep a copy as `packages/schemas/data/draft-07-meta-schema.json`.

**In this project:**
- We build a **per–rule-set meta-schema**: a restricted subset of draft-07 that says “for this provider, a valid schema may only use these keywords.” Each file under `rule-set-meta-schemas/<ruleSetId>.generated.json` is such a meta-schema.
- We use it to validate that a **schema** (the user’s document) is valid *for that rule set* when we run AJV (e.g. in tests). Our main validation path uses custom logic (`validateSchemaForRuleSet`) that does not load these files; the generated meta-schemas are for tools like Monaco or external validators.

**Use the word “meta-schema” when:** Referring to:
- `draft-07-meta-schema.json`
- Generated files in `rule-set-meta-schemas/*.generated.json`
- The code that *builds* those files (e.g. “builds a per–rule-set meta-schema”)

**Do not use “meta-schema” for:** The user’s schema, or the act of validating the user’s schema against provider rules (that is “schema validation”).

---

## 3. Metadata

**What it is:** **Data about the dataset**, not about schemas or meta-schemas. For example: version, lastUpdated, comparison columns, legend, provider badge classes.

**Where it lives:** The top-level key **`meta`** in `schema_rule_sets.json` holds this metadata. In types it appears as `SchemaRuleSetsMeta` or `data.meta`.

**Use the word “metadata” when:** Referring to that object or to “info about the rule sets dataset.” In code/comments you can say “the `meta` object” or “dataset metadata” to be explicit.

**Do not use “metadata” for:** Meta-schemas. “Meta” in **meta-schema** means “about schemas” (schema-for-schemas), not “metadata.”

---

## Quick reference

| Term        | Meaning                          | Examples |
|------------|-----------------------------------|----------|
| **schema** | JSON Schema that describes data   | User’s schema, `validate_schema` input, sample schemas |
| **meta-schema** | JSON Schema that validates schemas | `draft-07-meta-schema.json`, `rule-set-meta-schemas/*.generated.json` |
| **metadata** | Data about the rule sets dataset  | `schema_rule_sets.json` top-level `meta` |

---

## Naming in code and paths

- **Schema** – e.g. `validateSchemaForRuleSet`, “schema editor,” “paste a schema.”
- **Meta-schema** – e.g. `rule-set-meta-schemas/`, `draft-07-meta-schema.json`, “build a per–rule-set meta-schema,” “meta-schema validation” (validating a schema against a meta-schema).
- **Metadata** – e.g. “dataset metadata,” “the `meta` object,” `SchemaRuleSetsMeta`.
