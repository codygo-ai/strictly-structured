# Claude Code / Cursor Skill

The skill plugin (`packages/skill`) provides conversational schema validation inside Cursor or Claude Code.

## What It Does

Instead of using tool calls directly (like the MCP server), the skill offers a natural language interface: ask your AI assistant to validate or fix a schema and it handles the rest. The skill is named `validate-schema` and validates JSON schemas for LLM structured outputs against OpenAI, Anthropic, and Google Gemini provider rules.

## Package Structure

- `plugin.json` — Skill metadata (name, description, version, keywords)
- `src/validate.mjs` — Main skill implementation (compiled output)
- `skills/validate-schema/` — Skill directory for installation
- `build.ts` — Build script

## Setup

Copy the skill directory into your project's `.cursor/skills/` folder, or install via the Cursor skill marketplace if available.

## Usage

Once installed, ask your AI assistant:

- "Validate this schema for OpenAI"
- "Check if my schema works with Anthropic Claude"
- "Fix my schema for Gemini"

The skill uses the same `@ssv/schemas` validation and fix engines as the web app and MCP server.
