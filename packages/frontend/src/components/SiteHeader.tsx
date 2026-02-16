'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { FeedbackWidget } from '~/components/FeedbackWidget';
import { HelpPopover } from '~/components/HelpPopover';
import { SiteLogo } from '~/components/SiteLogo';
import { ThemeToggle } from '~/components/ThemeToggle';
import { UserAvatarMenu } from '~/components/UserAvatarMenu';

export function SiteHeader({ subtitle = true }: { subtitle?: boolean }) {
  const pathname = usePathname();
  const current = pathname.startsWith('/terms')
    ? 'terms'
    : pathname.startsWith('/why')
      ? 'why'
      : pathname.startsWith('/models')
        ? 'models'
        : 'playground';

  const linkClass = 'text-sm text-secondary hover:text-primary transition-colors cursor-pointer';
  const activeClass = 'text-sm text-accent cursor-default';

  return (
    <header className="validator-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-3">
        <SiteLogo className="h-[2.503rem] w-[2.503rem] text-primary opacity-80" />
        <div>
          <h1 className="validator-title flex items-center gap-2">
            <span className="font-bold text-primary">Strictly Structured</span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-accent border border-accent/30 rounded px-1.5 py-0.5 leading-none">
              Beta
            </span>
          </h1>
          {subtitle && (
            <p className="validator-subtitle -mt-1.5">
              Validate, auto-fix &amp; optimize structured output schemas for any LLM
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 self-start sm:self-center">
        <nav className="flex items-center gap-4">
          {current === 'playground' ? (
            <span className={activeClass} aria-current="page">
              Playground
            </span>
          ) : (
            <Link href="/" className={linkClass}>
              Playground
            </Link>
          )}
          {current === 'models' ? (
            <span className={activeClass} aria-current="page">
              Explore Models
            </span>
          ) : (
            <Link href="/models" className={linkClass}>
              Explore Models
            </Link>
          )}
          {current === 'why' ? (
            <span className={activeClass} aria-current="page">
              See Why
            </span>
          ) : (
            <Link href="/why" className={linkClass}>
              See Why
            </Link>
          )}
          {current === 'terms' ? (
            <span className={activeClass} aria-current="page">
              Terms
            </span>
          ) : (
            <Link href="/terms" className={linkClass}>
              Terms
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
