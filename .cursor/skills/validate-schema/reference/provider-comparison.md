# Provider Comparison

| Feature | OpenAI | Anthropic | Gemini |
|---------|--------|-----------|--------|
| Root type | object | object | object, array |
| All fields required | mandatory | optional | optional |
| additionalProperties: false | mandatory | recommended | optional |
| anyOf | supported | supported | supported |
| allOf / oneOf / not | unsupported | unsupported | unsupported |
| $ref / $defs | supported | supported | supported ($ref) |
| Recursive schemas | supported | supported (depth limited) | supported |
| pattern (string) | supported* | unsupported | unsupported |
| format (string) | supported* (8 formats) | unsupported | supported (3 formats) |
| minimum / maximum | supported* | unsupported | supported |
| exclusiveMin / Max | supported* | unsupported | unsupported |
| multipleOf | supported* | unsupported | unsupported |
| minItems / maxItems | supported* | unsupported | supported |
| prefixItems | unsupported | unsupported | supported |
| title field | unsupported | unsupported | supported |
| Max properties | 5,000 | ~ | ~ |
| Max nesting | 10 | ~ | ~ |
| Unknown keywords | 400 error | SDK handles | ignored |

\* Not supported on fine-tuned OpenAI models.

## OpenAI Supported String Formats

`date-time`, `date`, `time`, `duration`, `email`, `hostname`, `ip-address`, `uuid`

## Gemini Supported String Formats

`date-time`, `date`, `enum`
