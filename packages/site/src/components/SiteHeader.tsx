import Link from "next/link";

export function SiteHeader({
  subtitle = true,
  current = "validator",
}: {
  subtitle?: boolean;
  current?: "validator" | "why" | "models";
}) {
  const linkClass = "text-sm text-accent hover:underline";
  const activeClass = "text-primary font-medium hover:no-underline";

  return (
    <header className="validator-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <Link href="/" className="block">
        <h1 className="validator-title">LLM Structured Output Validators</h1>
        {subtitle && (
          <p className="validator-subtitle mt-1">
            Validate, auto-fix, edit and optimize structured output schemas for any LLM
          </p>
        )}
      </Link>
      <nav className="flex items-center gap-4 self-start sm:self-center">
        <Link
          href="/"
          className={current === "validator" ? activeClass : linkClass}
        >
          Validator
        </Link>
        <Link
          href="/why"
          className={current === "why" ? activeClass : linkClass}
        >
          Why use this?
        </Link>
        <Link
          href="/models"
          className={current === "models" ? activeClass : linkClass}
        >
          Model support
        </Link>
      </nav>
    </header>
  );
}
