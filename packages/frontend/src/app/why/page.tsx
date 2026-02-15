import Link from "next/link";

const BEFORE_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "category": {
      "oneOf": [
        { "type": "string" },
        { "type": "integer" }
      ]
    }
  },
  "required": ["name", "category"]
}`;

const AFTER_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "category": { "type": "string" },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["name", "category", "tags"],
  "additionalProperties": false
}`;

export default function WhyPage() {
  return (
    <article className="space-y-8">
      {/* Hero section with before/after */}
      <section className="rounded-lg border border-border bg-surface p-8 text-center">
        <h1 className="text-3xl font-bold text-primary tracking-tight">
          Ship schemas that work everywhere
        </h1>
        <p className="mt-3 text-secondary max-w-2xl mx-auto leading-relaxed">
          LLMs differ in which JSON Schema features they support. This validator
          catches incompatibilities before they hit production and auto-fixes
          them.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-error mb-2">
              Before — has issues
            </div>
            <pre className="rounded-md bg-code-bg border border-border p-4 text-xs font-mono text-secondary overflow-x-auto leading-relaxed">{BEFORE_SCHEMA}</pre>
            <p className="text-[11px] text-muted mt-2">
              <code className="text-error">oneOf</code> with mixed types is
              rejected by strict providers
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-success mb-2">
              After — fixed
            </div>
            <pre className="rounded-md bg-code-bg border border-border p-4 text-xs font-mono text-secondary overflow-x-auto leading-relaxed">{AFTER_SCHEMA}</pre>
            <p className="text-[11px] text-muted mt-2">
              Single type, all fields required,{" "}
              <code className="text-success">additionalProperties: false</code>
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
        >
          Try it now
        </Link>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6 border-l-4 border-l-accent">
        <h2 className="text-lg font-semibold text-primary mb-3">
          One schema, many models
        </h2>
        <p className="text-secondary text-sm leading-relaxed">
          Each provider supports a slightly different subset of JSON Schema
          (keywords, nesting, combinations). Without checking, you may ship a
          schema that fails at runtime for some models. Here you pick a model
          group, see requirements and issues, and fix the schema so it works
          everywhere you need.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6 border-l-4 border-l-accent">
        <h2 className="text-lg font-semibold text-primary mb-3">
          Clear requirements and auto-fix
        </h2>
        <p className="text-secondary text-sm leading-relaxed">
          The sidebar shows per-keyword rules for the selected model group:
          what&apos;s allowed, what&apos;s not, and suggested fixes. Issues in
          the editor link to those rules and offer one-click fixes where possible
          (e.g. replacing unsupported keywords or simplifying structure).
        </p>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6 border-l-4 border-l-accent">
        <h2 className="text-lg font-semibold text-primary mb-3">
          Optimize for cost and compatibility
        </h2>
        <p className="text-secondary text-sm leading-relaxed">
          Validation groups are chosen so that the same rules apply to multiple
          models (e.g. all GPT-4.1 variants). You can validate against the
          strictest model in a group and be confident the schema works for
          cheaper models in the same group. The{" "}
          <Link href="/models" className="text-accent hover:underline">
            Model support
          </Link>{" "}
          page lists what each model accepts.
        </p>
      </section>

      <div className="text-center py-4">
        <Link
          href="/"
          className="text-sm font-medium text-accent hover:underline"
        >
          Open the validator and try it now
        </Link>
      </div>
    </article>
  );
}
