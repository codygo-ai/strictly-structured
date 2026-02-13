import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur">
      <div className="container mx-auto px-4 py-4 max-w-6xl flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white hover:text-[var(--accent)] transition-colors"
        >
          Codygo
          <span className="text-[var(--foreground)] font-semibold ml-2">
            Structured Schema Validator
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/models"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Model support
          </Link>
          <a
            href="https://github.com/codygo-ai/structured-schema-validator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
