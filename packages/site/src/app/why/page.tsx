export default function WhyPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary tracking-tight">
          Why use this?
        </h1>
        <p className="mt-2 text-secondary leading-relaxed">
          LLMs that support structured outputs (GPT, Claude, Gemini, etc.) rely on
          JSON Schema to define the shape of responses. Schemas that work in one
          model often fail or behave differently in another. This validator helps
          you keep schemas correct and portable.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
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

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-primary mb-3">
          Clear requirements and auto-fix
        </h2>
        <p className="text-secondary text-sm leading-relaxed">
          The sidebar shows per-keyword rules for the selected model group:
          what’s allowed, what’s not, and suggested fixes. Issues in the editor
          link to those rules and offer one-click fixes where possible (e.g.
          replacing unsupported keywords or simplifying structure).
        </p>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-primary mb-3">
          Optimize for cost and compatibility
        </h2>
        <p className="text-secondary text-sm leading-relaxed">
          Validation groups are chosen so that the same rules apply to multiple
          models (e.g. all GPT-4.1 variants). You can validate against the
          strictest model in a group and be confident the schema works for
          cheaper models in the same group. The{" "}
          <a href="/models" className="text-accent hover:underline">
            Model support
          </a>{" "}
          page lists what each model accepts.
        </p>
      </section>

      <p className="text-sm text-muted">
        Use the validator on the home page to paste or upload a schema, pick a
        model group, and fix any issues before shipping.
      </p>
    </article>
  );
}
