import Link from "next/link";

const ISSUES = [
  {
    heading: "Type Safety",
    before: `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" },  // ⚠️ no integer constraint
    "role": { "type": "string" }
  }
  // ⚠️ missing "required" — model may omit fields
  // ⚠️ missing "additionalProperties: false"
}`,
    after: `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" },       // ✓ precise type
    "role": { "type": "string" }
  },
  "required": ["name", "age", "role"],   // ✓ all fields required
  "additionalProperties": false           // ✓ no extra fields
}`,
    explanation:
      "Without strict constraints, models inject unexpected fields or omit values entirely. Adding additionalProperties: false and requiring all fields ensures you get exactly what you expect — nothing more, nothing less.",
  },
  {
    heading: "Accuracy",
    before: `{
  "type": "object",
  "properties": {
    "sentiment": { "type": "string" },   // ⚠️ no guidance — model guesses
    "confidence": { "type": "number" },  // ⚠️ unbounded — could be 9999
    "language": { "type": "string" }     // ⚠️ free-form — "English", "en", "eng"?
  },
  "required": ["sentiment", "confidence", "language"],
  "additionalProperties": false
}`,
    after: `{
  "type": "object",
  "properties": {
    "sentiment": {
      "type": "string",
      "enum": ["positive", "negative", "neutral"]  // ✓ constrained values
    },
    "confidence": {
      "type": "number",
      "minimum": 0, "maximum": 1                   // ✓ bounded range
    },
    "language": {
      "type": "string",
      "description": "ISO 639-1 code, e.g. 'en'"   // ✓ format guidance
    }
  },
  "required": ["sentiment", "confidence", "language"],
  "additionalProperties": false
}`,
    explanation:
      "Without enums, bounds, and descriptions, models guess values freely. You get \"happy\" instead of \"positive\", confidence scores of 85 instead of 0.85, and inconsistent language codes. Adding constraints guides the model to produce precise, consistent output.",
  },
  {
    heading: "Compatibility",
    before: `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "category": {
      "oneOf": [                        // ⚠️ rejected by OpenAI strict mode
        { "type": "string" },
        { "type": "integer" }
      ]
    }
  },
  "required": ["name", "category"]
  // ⚠️ works on Anthropic, fails on OpenAI
}`,
    after: `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "category": { "type": "string" }    // ✓ single type — works everywhere
  },
  "required": ["name", "category"],
  "additionalProperties": false          // ✓ universal compatibility
}`,
    explanation:
      "Each provider supports a different subset of JSON Schema. A schema that works on one may fail silently or be rejected outright on another. Validating against your target model catches these incompatibilities before deployment.",
  },
  {
    heading: "Predictability",
    before: `{
  "type": "object",
  "properties": {
    "result": {
      "anyOf": [                         // ⚠️ ambiguous — model picks randomly
        {
          "type": "object",
          "properties": {
            "value": { "type": "string" },
            "items": {                   // ⚠️ deep nesting confuses models
              "anyOf": [
                { "type": "string" },
                { "type": "array", "items": { "type": "string" } }
              ]
            }
          }
        },
        { "type": "string" }
      ]
    }
  }
}`,
    after: `{
  "type": "object",
  "properties": {
    "value": { "type": "string" },       // ✓ flat, explicit
    "items": {
      "type": "array",                   // ✓ single clear type
      "items": { "type": "string" }
    }
  },
  "required": ["value", "items"],
  "additionalProperties": false           // ✓ predictable structure
}`,
    explanation:
      "Complex schema structures with deep nesting and ambiguous unions confuse models. They may produce partially valid output, hallucinate fields, or silently fall back to unstructured text. Simpler, flatter schemas produce far more predictable results.",
  },
];

export default function WhyPage() {
  return (
    <article className="space-y-8">
      <section className="rounded-lg border border-border bg-surface p-8 text-center">
        <h1 className="text-3xl font-bold text-primary tracking-tight">
          Ship schemas that work for you
        </h1>
        <p className="mt-3 text-secondary max-w-2xl mx-auto leading-relaxed">
          Need to ensure cross-provider compatibility? Or squeeze the most out
          of a single model&apos;s structured output? Without validation, models
          silently ignore unsupported schema features — and you get unexpected
          results.
        </p>
      </section>

      {ISSUES.map((issue) => (
        <section
          key={issue.heading}
          className="rounded-lg border border-border bg-surface p-6"
        >
          <h2 className="text-lg font-semibold text-primary mb-4">
            {issue.heading}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-error mb-2">
                Before — has issues
              </div>
              <pre className="rounded-md bg-code-bg border border-border p-4 text-xs font-mono text-secondary overflow-x-auto leading-relaxed">
                {issue.before}
              </pre>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-success mb-2">
                After — fixed
              </div>
              <pre className="rounded-md bg-code-bg border border-border p-4 text-xs font-mono text-secondary overflow-x-auto leading-relaxed">
                {issue.after}
              </pre>
            </div>
          </div>
          <p className="mt-4 text-sm text-secondary leading-relaxed">
            {issue.explanation}
          </p>
        </section>
      ))}

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <h3 className="text-sm font-semibold text-primary mb-1">
              See every issue
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Catch problems before they reach production — per keyword, per
              model.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary mb-1">
              Know it&apos;s valid
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Validate against the exact model you&apos;re deploying to. No
              guessing.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary mb-1">
              Fix in one click
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Auto-fix resolves issues instantly, or shows you exactly what to
              change.
            </p>
          </div>
        </div>
      </section>

      <div className="text-center py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
        >
          Try it now
        </Link>
        <div className="mt-3">
          <Link
            href="/models"
            className="text-sm text-accent hover:underline"
          >
            Explore Models
          </Link>
        </div>
      </div>
    </article>
  );
}
