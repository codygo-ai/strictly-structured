# Architecture

## Overview

Strictly Structured is a monorepo that validates and auto-fixes JSON schemas for LLM structured output APIs across OpenAI, Anthropic, and Google Gemini. It ships through three distribution channels: a web app, an MCP server, and a Claude Code skill.

## Distribution Channels

| Channel | Package | Purpose |
|---------|---------|---------|
| **Web app** | `packages/frontend` | Discovery and exploration surface — paste a schema, validate, fix, export |
| **MCP Server** | `packages/mcp-server` | Local validation inside Cursor, Claude Desktop, or any MCP client |
| **Skill plugin** | `packages/skill` | Conversational in-editor validation for Cursor / Claude Code |

## Monorepo Structure

```
├── packages/
│   ├── frontend        # Next.js static export — validator UI
│   ├── backend         # Firebase Cloud Functions — /api/validate, /api/fix
│   ├── schemas         # Canonical schemaRuleSets.json, validator, fixer — single source of truth
│   ├── mcp-server      # MCP server exposing validate_schema, fix_schema, list_groups
│   ├── skill           # Claude Code / Cursor skill plugin
│   └── audit           # Shared test data and utilities for validating rule sets
├── devops/
│   ├── tsconfig        # Shared TypeScript configuration
│   └── eslint-config   # Shared ESLint flat config
└── docs/               # Project documentation
```

## Data Flow

### Single Source of Truth

`packages/schemas/data/schemaRuleSets.json` is the canonical dataset. It defines:
- Rule sets that group providers with identical schema support
- Per-rule-set constraints (supported/unsupported keywords, limits, behaviors)
- Metadata (version, lastUpdated, comparison columns, legend)

The `@ssv/schemas` package also exports the validation engine (`ruleSetValidator`), auto-fix engine (`ruleSetFixer`), TypeScript types, and an aggregated meta-schema — all imported directly by consumers.

### Client-Side Validation Pipeline

1. User types/pastes a schema in the Monaco editor
2. `ruleSetValidator` runs (debounced, 200ms)
3. Returns `SchemaMarker[]` with line/col positions, messages, and severities
4. Markers applied to Monaco model (squiggly underlines)
5. User hovers a marker to see the error message
6. User clicks "Auto-fix" — `schemaFixer` transforms the schema

### Server-Side Validation (Optional)

1. User clicks "Test with Real APIs" (requires auth)
2. POST `/api/validate` or `/api/fix` to Firebase Cloud Functions
3. Backend calls the actual provider endpoint (OpenAI, Anthropic, or Google)
4. Results returned per model: success/failure, latency, error message

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Monaco Editor, Firebase SDK
- **Backend**: Firebase Cloud Functions, Firebase Admin SDK
- **Monorepo**: pnpm workspaces, Turborepo
- **Language**: TypeScript (strict)
- **Code Quality**: ESLint, TypeScript compiler, Husky pre-commit hooks
- **Deployment**: Firebase Hosting (static) + Cloud Functions
