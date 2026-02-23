# Testing the MCP Server

## Method 1: Test via Cursor (Recommended)

1. **Ensure `.cursor/mcp.json` is configured** (already done)
2. **Restart Cursor** (or reload window: `Cmd+Shift+P` → "Developer: Reload Window")
3. **After restart**, the MCP server "ssv" should be available
4. **Test by asking the AI** to use MCP tools, e.g.:
   - "List rule sets" or "Call list_rule_sets"
   - "Validate this schema for OpenAI: {\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}}}"
   - "Fix this schema for Gemini: {...}"

## Method 2: Manual Testing (Command Line)

The MCP server uses stdio protocol, so testing manually requires sending JSON-RPC messages:

```bash
# Start the server (it will wait for stdio input)
cd packages/mcp-server
pnpm exec node dist/index.js

# In another terminal, send JSON-RPC messages via stdin
# Example: List tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | pnpm exec node dist/index.js
```

## Method 3: Test via HTTP Mode

The MCP server also supports HTTP mode:

```bash
# Start HTTP server
cd packages/mcp-server
pnpm exec node dist/index.js --http --port 3100

# Then test with curl or Postman
curl -X POST http://localhost:3100 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Available MCP Tools

Once connected, you can use these tools:

- `validate_schema` - Validate a JSON schema against provider rules
- `fix_schema` - Auto-fix a schema for a provider
- `list_rule_sets` - List available rule sets
- `convert_code` - Convert between Zod/Pydantic/JSON Schema
- `validate_code` - Validate Zod/Pydantic code
- `fix_code` - Fix Zod/Pydantic code
- `preview_sdk_transform` - Preview SDK transformations
- `list_sdks` - List supported SDKs

## Troubleshooting

**If MCP server doesn't appear in Cursor:**
1. Check `.cursor/mcp.json` exists and has correct path
2. Restart Cursor completely
3. Check Cursor's MCP logs (if available in settings)
4. Try adding config to user settings instead of project settings

**If you get module resolution errors:**
- Make sure all packages are built: `pnpm run build`
- Make sure dependencies are installed: `pnpm install`
- The MCP server needs to run in a pnpm workspace context
