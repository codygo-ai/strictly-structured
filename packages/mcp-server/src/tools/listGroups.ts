import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGroupsByProviders, getMeta } from "../lib/groups";
import type { ProviderId } from "../lib/types";

export function registerListGroupsTool(server: McpServer): void {
  server.tool(
    "list_groups",
    "List available LLM provider groups and their models for structured output schema validation.",
    {
      provider: z
        .enum(["openai", "anthropic", "gemini"])
        .optional()
        .describe("Filter to a specific provider. Returns all if omitted."),
    },
    async ({ provider }) => {
      const providers = provider ? [provider as ProviderId] : undefined;
      const groups = getGroupsByProviders(providers);
      const meta = getMeta();

      const result = {
        groups: groups.map((g) => ({
          groupId: g.groupId,
          groupName: g.groupName,
          provider: g.provider,
          providerId: g.providerId,
          models: g.models,
          description: g.description,
          docUrl: g.docUrl,
        })),
        meta: {
          version: meta.version,
          lastUpdated: meta.lastUpdated,
        },
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, undefined, 2) }],
      };
    }
  );
}
