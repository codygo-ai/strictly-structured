export const metadata = {
  title: "Terms of Use | Structured Schema Validator",
};

export default function TermsPage() {
  return (
    <article className="space-y-6 text-sm leading-relaxed text-secondary">
      <h1 className="text-2xl font-bold text-primary tracking-tight">
        Terms of Use
      </h1>
      <p className="text-muted text-xs">Last updated: February 14, 2026</p>

      <section>
        <h2 className="text-base font-semibold text-primary mb-2">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using the Structured Schema Validator service
          (&quot;Service&quot;), you agree to be bound by these Terms of Use. If
          you do not agree, please do not use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-primary mb-2">
          2. Description of Service
        </h2>
        <p>
          The Service provides tools for validating JSON schemas against
          structured output capabilities of various large language model (LLM)
          providers. The Service is provided on an &quot;as-is&quot; basis for
          informational and development purposes.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-primary mb-2">
          3. Disclaimer of Warranties
        </h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. We do not
          warrant that validation results are accurate, complete, or reliable
          for any particular use case.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-primary mb-2">
          4. Limitation of Liability
        </h2>
        <p>
          IN NO EVENT SHALL THE SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT
          OF OR RELATED TO YOUR USE OF THE SERVICE, WHETHER BASED ON WARRANTY,
          CONTRACT, TORT, OR ANY OTHER LEGAL THEORY.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-primary mb-2">
          5. User Content
        </h2>
        <p>
          You retain ownership of any schemas or content you submit to the
          Service. By submitting content, you grant us a non-exclusive,
          royalty-free license to use, process, and store such content for the
          purpose of providing and improving the Service.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-primary mb-2">
          6. Acceptable Use
        </h2>
        <p className="mb-2">You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to disrupt or overload the Service infrastructure</li>
          <li>Circumvent any security or access controls</li>
          <li>Use automated tools to scrape or abuse the Service</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-primary mb-2">
          7. Data Collection and Usage
        </h2>
        <p className="mb-2">
          To improve the quality and reliability of the Service, we collect
          anonymous technical data during your use. This includes:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Schema structures and validation inputs submitted through the
            Service
          </li>
          <li>
            Validation results, performance metrics, and error diagnostics
          </li>
          <li>
            Interaction patterns such as feature usage and session activity
          </li>
        </ul>
        <p className="mt-2">
          This data is collected anonymously and is not linked to any personally
          identifiable information. We do not collect names, email addresses, IP
          addresses, or authentication credentials through our analytics system.
          Collected data is used solely for improving the Service, analyzing
          validation patterns, and enhancing compatibility across LLM providers.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-primary mb-2">
          8. Changes to Terms
        </h2>
        <p>
          We reserve the right to modify these Terms at any time. Continued use
          of the Service after changes constitutes acceptance of the modified
          Terms.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-primary mb-2">
          9. Contact
        </h2>
        <p>
          For questions about these Terms, please visit{" "}
          <a
            href="https://codygo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            codygo.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
