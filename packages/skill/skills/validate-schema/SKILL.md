---
name: validate-schema
description: >
  Validate a JSON schema for LLM structured outputs against provider rules
  (OpenAI, Anthropic, Google Gemini). Use when a user has a JSON schema for
  structured outputs, asks about LLM schema compatibility, wants to check if a
  schema works with a specific provider, or is debugging structured output errors.
argument-hint: "[file-path | provider-name | 'fix']"
allowed-tools: Read, Grep, Glob, Bash(node *)
---

# Validate Schema for LLM Structured Outputs

You validate JSON schemas against provider-specific rules for OpenAI, Anthropic, and Google Gemini structured outputs.

## Step 1: Get the Schema

Obtain the JSON schema from one of these sources (in priority order):

1. **File path in `$ARGUMENTS`** — read the file
2. **Provider name in `$ARGUMENTS`** (e.g., "openai") — ask the user for the schema, then validate only against that provider
3. **`fix` in `$ARGUMENTS`** — validate and then apply fixes
4. **Inline JSON in the conversation** — use the schema from the user's message
5. **Search the project** — use Glob to find `.json` files that look like JSON schemas

If you cannot determine the schema, ask the user.

## Step 2: Validate

**Prefer MCP when available.** If the SSV MCP server is available in this environment, use these tools first (do not run the script):
- `validate_schema` — validate the schema; pass schema as a JSON string.
- `fix_schema` — if the user asked for fixes; pass schema and provider.
- `explain_errors` — if the user wants to understand why validation failed; pass schema and optional providers.

**Only when MCP is not available**, run the validation script. The script and rules file are in this skill's directory.

```bash
node scripts/validate.mjs \
  --schema-file <path-to-schema> \
  --rules-file rules/schema_rule_sets.json
```

Or with inline JSON (add `--format human` for a readable table instead of JSON):

```bash
node scripts/validate.mjs \
  --schema '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}' \
  --rules-file rules/schema_rule_sets.json \
  --format human
```

To validate against a specific provider only:

```bash
node scripts/validate.mjs \
  --schema-file <path> \
  --rules-file rules/schema_rule_sets.json \
  --provider openai
```

The script outputs JSON by default, or a human-readable table with `--format human`.

### Fallback

If Node.js is not available, read `rules/schema_rule_sets.json` and validate the schema by reasoning through each rule set's rules manually.

## Step 3: Present Results

Format the output as a clear table:

```
## Schema Validation Results

| Provider           | Status | Errors |
|--------------------|--------|--------|
| OpenAI (GPT-4+)    | PASS   | 0      |
| Anthropic (Claude)  | FAIL   | 3      |
| Gemini (2.5+)       | PASS   | 0      |
```

Then list each error with its location and a suggested fix.

## Step 4: Fix (if requested)

If the user asks for fixes or passed `fix` as an argument:

1. For each error, suggest a specific fix based on the rules
2. Common fixes:
   - Missing `additionalProperties: false` → add it to every object
   - Properties not in `required` → add all to the required array
   - Unsupported keyword (e.g., `minLength`) → move the constraint to the `description` field
   - Unsupported composition (`allOf`, `oneOf`, `not`) → remove or restructure
   - Invalid root type → wrap in `{"type":"object","properties":{"data": <original>}}`
3. Output the corrected schema

## Reference

For detailed provider rules, see `reference/validation-logic.md`.
For a feature comparison table across providers, see `reference/provider-comparison.md`.
