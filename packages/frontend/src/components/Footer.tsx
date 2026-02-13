export function Footer() {
  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--card)]/50 py-6 mt-auto">
      <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
        <span>Open source by Codygo</span>
        <div className="flex gap-6">
          <a
            href="https://codygo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            codygo.com
          </a>
          <a
            href="https://github.com/codygo-ai/structured-schema-validator"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
