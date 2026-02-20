# Setting Up MCP Server in Cursor

This guide explains how to configure the `@ssv/mcp-server` MCP server for use in Cursor IDE.

## Current Setup

Your project already has an MCP server configured at `.cursor/mcp.json`. The server is located at `packages/mcp-server/` and exposes tools for validating JSON schemas against LLM provider rules.

## Configuration File Location

**Correct location**: `.cursor/mcp.json` (project-level, can be committed to git)

**Incorrect location**: `.cursor-mcp-config.json` (this file has been removed)

## Configuration Options

### Option 1: Local Development (Recommended)

Run the server via pnpm so workspace and dependency resolution work correctly:

```json
{
  "mcpServers": {
    "ssv": {
      "command": "pnpm",
      "args": [
        "--filter",
        "@ssv/mcp-server",
        "run",
        "start"
      ]
    }
  }
}
```

**Requirements**:
- Build once: `pnpm --filter @ssv/mcp-server run build` (or `pnpm run build` from root)
- Node.js and pnpm must be in your PATH
- Cursor runs the command from the workspace root; pnpm runs the server from `packages/mcp-server` so `node_modules` resolve correctly

### Option 2: Published NPM Package (Recommended for Team Sharing)

If `@ssv/mcp-server` is published to npm, use:

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

This approach:
- ✅ Works for all team members without path configuration
- ✅ Automatically uses the latest published version
- ✅ No need to build locally

## Building the MCP Server

Before using the local server, ensure it's built:

```bash
# Build just the MCP server
pnpm --filter @ssv/mcp-server run build

# Or build all packages
pnpm run build
```

## Verifying the Setup

1. **Restart Cursor completely** after making changes to `.cursor/mcp.json`
2. Check Cursor's MCP status (usually in settings or status bar)
3. Try using one of the MCP tools in a chat:
   - `list_rule_sets` - List available provider rule sets
   - `validate_schema` - Validate a JSON schema
   - `list_sdks` - List supported SDKs

## Available Tools

The MCP server exposes the following tools:

### Schema Tools
- `validate_schema` - Validate JSON schemas against provider rules
- `fix_schema` - Auto-fix schema compatibility issues
- `list_rule_sets` - List available provider rule sets

### Code Tools
- `convert_code` - Convert between Zod, Pydantic, and JSON Schema
- `validate_code` - Validate Zod/Pydantic code
- `fix_code` - Fix code compatibility issues

### SDK Tools
- `preview_sdk_transform` - Preview SDK transformations
- `list_sdks` - List supported SDKs

See [mcp-server.md](./mcp-server.md) for detailed documentation.

## Troubleshooting

### Server not starting
- Ensure Node.js is installed and in PATH
- Verify the server is built: check that `packages/mcp-server/dist/index.js` exists
- Check Cursor's error logs for MCP server errors

### Changes not taking effect
- **Always restart Cursor completely** after changing `.cursor/mcp.json`
- Changes are not hot-reloaded

## Team Sharing

For team collaboration:
1. Commit `.cursor/mcp.json` to git
2. Use Option 2 (npm package) if published, or Option 1 with relative paths
3. Document the build step in your README or setup docs
4. Consider adding a `pnpm postinstall` script to auto-build the MCP server
