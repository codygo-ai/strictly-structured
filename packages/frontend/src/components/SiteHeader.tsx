import Link from "next/link";
import { UserAvatarMenu } from "~/components/UserAvatarMenu";
import { BetaBadge } from "~/components/BetaBadge";
import { FeedbackWidget } from "~/components/FeedbackWidget";
import { ThemeToggle } from "~/components/ThemeToggle";

export function SiteHeader({
  subtitle = true,
  current = "validator",
}: {
  subtitle?: boolean;
  current?: "validator" | "why" | "models";
}) {
  const linkClass = "text-sm text-secondary hover:text-primary transition-colors cursor-pointer";
  const activeClass = "text-sm text-accent font-medium hover:no-underline cursor-default";

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

          <BetaBadge />
        </h1>
        {subtitle && (
          <p className="validator-subtitle mt-1">
            Validate, auto-fix, edit and optimize structured output schemas for any LLM
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 self-start sm:self-center">
        <nav className="flex items-center gap-4">
          {current === "why" ? (
            <span className={activeClass} aria-current="page">
              Why use this?
            </span>
          ) : (
            <Link href="/why" className={linkClass}>
              Why use this?
            </Link>
          )}
          {current === "models" ? (
            <span className={activeClass} aria-current="page">
              Model support
            </span>
          ) : (
            <Link href="/models" className={linkClass}>
              Model support
            </Link>
          )}
          <FeedbackWidget />
        </nav>
        <ThemeToggle />
        <UserAvatarMenu />
      </div>
    </header>
  );
}
