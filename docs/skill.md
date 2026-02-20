# Claude Code / Cursor Skill

The skill plugin (`packages/skill`) provides conversational schema validation inside Cursor or Claude Code.

## What It Does

Instead of using tool calls directly (like the MCP server), the skill offers a natural language interface: ask your AI assistant to validate or fix a schema and it handles the rest. The skill is named `validate-schema` and validates JSON schemas for LLM structured outputs against OpenAI, Anthropic, and Google Gemini provider rules.

## Setup

1. **Build** (from repo root):
   ```bash
   pnpm --filter @ssv/skill run build
   ```
2. **Install into this project** — copy the built skill into Cursor’s skills folder:
   ```bash
   mkdir -p .cursor/skills
   cp -R packages/skill/dist/validate-schema/skills/validate-schema .cursor/skills/validate-schema
   ```
3. **Reload Cursor** (e.g. `Cmd+Shift+P` → “Developer: Reload Window”) so it picks up the new skill.

## Usage

Once installed, in any Cursor chat **ask in plain language** (the AI will use the validate-schema skill when relevant):

- "Validate this schema for OpenAI"
- "Check if my schema works with Anthropic Claude"
- "Fix my schema for Gemini"

The skill uses the same `@ssv/schemas` validation and fix engines as the web app and MCP server.
