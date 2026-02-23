import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listSdks } from '@ssv/codegen';

export function registerListSdksTool(server: McpServer): void {
  server.tool(
    'list_sdks',
    'List supported SDK/framework simulations (Zod, Pydantic, etc.) with provider support and transform metadata. Use when the user asks about code generation or SDK compatibility.',
    {},
    async () => {
      const sdks = listSdks();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ sdks }, undefined, 2),
          },
        ],
      };
    },
  );
}
