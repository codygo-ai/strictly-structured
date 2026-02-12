# Shared TypeScript config (`@ssv/tsconfig`)

Single source of truth for compiler options. All apps and packages extend from here.

- **base.json** – Node/bundler targets (ES2020, ESNext, strict, etc.)
- **base-src.json** – Same as base; use for packages that have a `src/` folder and use the `~/` alias.
- **next.json** – Extends base + Next.js (for apps without `src/`).
- **next-src.json** – Extends base-src + Next.js (lib, JSX, plugin). Use for the Next.js app when it lives under `src/` (e.g. `src/app/`, `src/components/`, `src/lib/`).

### Packages with `src/` and `~/`

Every package that has a `src/` directory and uses `~/*` → `src/*` must repeat these in its own `tsconfig.json`:

- `baseUrl: "."`
- `paths: { "~/*": ["src/*"] }`
- `outDir: "dist"`
- `rootDir: "src"`

**Why they can’t live in base-src.json:** TypeScript resolves relative paths in an extended config relative to *that config file’s location*, not the package that extends it. So if we put them in `devops/tsconfig/base-src.json`, `rootDir`/`outDir`/`baseUrl` would point at `devops/tsconfig/`, not at the package. So each package defines them once; only package-specific options (e.g. `declaration`, `moduleResolution: "node"`) are added on top.
