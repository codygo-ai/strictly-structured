import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listSdks } from '@ssv/codegen';

export function registerListSdksTool(server: McpServer): void {
  server.tool(
    'list_sdks',
    'List all supported SDK/framework simulations with metadata. Shows which providers each SDK targets, what transforms it applies, and known gaps.',
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
