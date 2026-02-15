"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatarMenu } from "~/components/UserAvatarMenu";
import { BetaBadge } from "~/components/BetaBadge";
import { FeedbackWidget } from "~/components/FeedbackWidget";
import { HelpPopover } from "~/components/HelpPopover";
import { ThemeToggle } from "~/components/ThemeToggle";

export function SiteHeader({ subtitle = true }: { subtitle?: boolean }) {
  const pathname = usePathname();
  const current = pathname.startsWith("/why")
    ? "why"
    : pathname.startsWith("/models")
      ? "models"
      : "playground";

  const linkClass = "text-sm text-secondary hover:text-primary transition-colors cursor-pointer";
  const activeClass = "text-sm text-accent cursor-default";

  return (
    <header className="validator-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="block">
        <h1 className="validator-title">
          <span className="font-bold text-primary">
            Strictly Structured
          </span>

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
          {current === "playground" ? (
            <span className={activeClass} aria-current="page">
              Playground
            </span>
          ) : (
            <Link href="/" className={linkClass}>
              Playground
            </Link>
          )}
          {current === "models" ? (
            <span className={activeClass} aria-current="page">
              Explore Models
            </span>
          ) : (
            <Link href="/models" className={linkClass}>
              Explore Models
            </Link>
          )}
          {current === "why" ? (
            <span className={activeClass} aria-current="page">
              See Why
            </span>
          ) : (
            <Link href="/why" className={linkClass}>
              See Why
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-1 ml-1 pl-3 border-l border-border">
          <HelpPopover />
          <FeedbackWidget />
          <ThemeToggle />
          <UserAvatarMenu />
        </div>
      </div>
    </header>
  );
}
