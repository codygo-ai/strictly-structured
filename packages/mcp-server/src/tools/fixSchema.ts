import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRuleSetByProvider } from "../lib/groups";
import { fixSchemaForRuleSet } from "../lib/fixer";
import type { ProviderId } from "../lib/types";

export function registerFixSchemaTool(server: McpServer): void {
  server.tool(
    "fix_schema",
    "Apply mechanical, rule-based fixes to a JSON schema to make it compatible with a specific LLM provider. No LLM API calls needed.",
    {
      schema: z.string().describe("The JSON schema to fix, as a JSON string"),
      provider: z
        .enum(["openai", "anthropic", "gemini"])
        .describe("The target provider to fix the schema for"),
    },
    async ({ schema, provider }) => {
      const ruleSet = getRuleSetByProvider(provider as ProviderId);
      if (!ruleSet) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Unknown provider: ${provider}` }) }],
          isError: true,
        };
      }

      const result = fixSchemaForRuleSet(schema, ruleSet);

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, undefined, 2) }],
      };
    }
  );
}
