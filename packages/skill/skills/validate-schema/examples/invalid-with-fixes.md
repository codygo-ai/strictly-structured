# Example: Invalid Schema with Fixes

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[^@]+@[^@]+$"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "maxItems": 10
    }
  }
}
```

## Validation Results

| Provider | Status | Errors |
|----------|--------|--------|
| OpenAI | FAIL | 2 |
| Anthropic | FAIL | 5 |
| Gemini | FAIL | 2 |

## Issues and Fixes

### All Providers
- **Missing `required`** — Add `"required": ["email", "tags"]`
- **Missing `additionalProperties: false`** — Add to root and all nested objects

### Anthropic
- **`minLength` unsupported** — Move to description: `"description": "minLength: 1"`
- **`pattern` unsupported** — Move to description: `"description": "pattern: ^[^@]+@[^@]+$"`
- **`minItems` / `maxItems` unsupported** — Move to description

### Gemini
- **`minLength` unsupported** — Move to description
- **`pattern` unsupported** — Move to description

## Fixed Schema (for all providers)

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "description": "minLength: 1. pattern: ^[^@]+@[^@]+$"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "minItems: 1. maxItems: 10"
    }
  },
  "required": ["email", "tags"],
  "additionalProperties": false
}
```
