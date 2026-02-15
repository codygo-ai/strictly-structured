# Downloaded JSON Schema Samples (Structured Outputs)

This directory holds **70 JSON schema samples per rule set** fetched from the [JSONSchemaBench](https://huggingface.co/datasets/epfl-dlab/JSONSchemaBench) dataset (EPFL Data Science Lab). Each file is a **schema** (describes data). They are intended as a basis for test cases for **meta-schema** validation (validating those schemas against our per–rule-set meta-schemas). See docs/VOCABULARY.md.

## Source

- **Dataset**: [epfl-dlab/JSONSchemaBench](https://huggingface.co/datasets/epfl-dlab/JSONSchemaBench) on Hugging Face
- **Content**: Real-world JSON schemas from GitHub, Kubernetes, API specs, GlaiveAI function calls, etc.
- **License**: MIT (see dataset page)

## Layout

- `gpt-4-o1/` – 70 samples (OpenAI-style structured output schemas)
- `claude-4-5/` – 70 samples (Anthropic-style)
- `gemini-2-5/` – 70 samples (Google Gemini-style)

Each file is JSON with:

- **`_meta`**: `groupId`, `name`, `description`, `expectation`, `expected` (`"unknown"`), `source`, `unique_id`
- **Rest**: the schema (e.g. `type`, `properties`, `required`, …)

## Regenerating

From repo root:

```bash
pnpm --filter @ssv/schemas run download-samples
```

Requires network access to `datasets-server.huggingface.co`.

## Using as test cases

1. Validate each sample schema against the per–rule-set meta-schema (e.g. via `groupMetaSchema.validation.test.ts` or CLI).
2. Set `_meta.expected` to `"valid"` or `"invalid"` and optionally `expectErrorPattern` for invalid cases.
3. Optionally copy or move selected files into `group-meta-schema-tests/{ruleSetId}/` and wire them into `getSamples()` / `buildSamples()` as needed.
