# MCP Server

The MCP server (`packages/mcp-server`) exposes schema and code validation tools for use in any MCP-compatible client (Cursor, Claude Desktop, Claude Code, etc.).

## Tools

### Schema Tools

| Tool | Description |
|------|-------------|
| `validate_schema` | Validate a JSON schema against provider rules (OpenAI, Anthropic, Gemini). Returns per-provider compatibility results with exact error locations. |
| `fix_schema` | Apply mechanical, rule-based fixes to make a schema compatible with a specific provider. No LLM API calls needed. |
| `list_groups` | List available provider rule sets and their models. |

### Code Tools

| Tool | Description |
|------|-------------|
| `convert_code` | Convert between Zod code, Pydantic code, and JSON Schema. Supports bidirectional conversion. |
| `validate_code` | Convert Zod/Pydantic code to JSON Schema, simulate SDK transform, and validate against provider rules. Shows the full pipeline. |
| `fix_code` | Fix Zod or Pydantic code to make it compatible with a specific provider. Converts to JSON Schema, applies fixes, then converts back. |

### SDK Tools

| Tool | Description |
|------|-------------|
| `preview_sdk_transform` | Show exactly what an SDK/framework sends to the provider API. Returns original schema, transformed schema, diff, and gap analysis. |
| `list_sdks` | List all supported SDK/framework simulations with metadata (providers, transforms, known gaps). |

## Prompts

| Prompt | Description |
|--------|-------------|
| `fix_schema` | Guided prompt for fixing a schema |
| `generate_schema` | Guided prompt for generating a schema |
| `explain_errors` | Guided prompt for explaining validation errors |

## Key Properties

- Runs locally — no API calls, no data leaves your machine
- Uses the same validation engine (`@ssv/schemas`) as the web app
- Code tools use `@ssv/codegen` for Zod/Pydantic conversion and SDK simulation
- Client-side only (no auth required)

## Setup

### Cursor

Add to your MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "ssv": {
      "command": "npx",
      "args": ["-y", "@ssv/mcp-server"]
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop MCP config:

```json
{
  "mcpServers": {
    "ssv": {
      "command": "npx",
      "args": ["-y", "@ssv/mcp-server"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add ssv -- npx -y @ssv/mcp-server
```
