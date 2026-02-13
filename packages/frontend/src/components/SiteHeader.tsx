import Link from "next/link";
import { UserAvatarMenu } from "~/components/UserAvatarMenu";

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
      <div className="block">
        <h1 className="validator-title">
          <Link href="/" className="font-bold text-primary hover:underline">
            Strictly Structured
          </Link>
          <span className="text-sm text-secondary">
            {" "}
            by{" "}
            <a
              href="https://codygo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Codygo
            </a>
          </span>
        </h1>
        {subtitle && (
          <p className="validator-subtitle mt-1">
            Validate, auto-fix, edit and optimize structured output schemas for any LLM
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 self-start sm:self-center">
        <nav className="flex items-center gap-4">
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
        <UserAvatarMenu />
      </div>
    </header>
  );
}
