import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRuleSetByProvider } from "../lib/groups";
import { formatRuleSetAsText } from "../lib/formatRules";
import type { ProviderId } from "../lib/types";

export function registerGenerateSchemaPrompt(server: McpServer): void {
  server.registerPrompt(
    "generate-schema",
    {
      title: "Generate JSON Schema for Provider",
      description:
        "Generates a JSON schema from a natural language description, fully compliant with a specific LLM provider's structured output rules.",
      argsSchema: {
        description: z
          .string()
          .describe("Natural language description of the desired schema structure and fields"),
        provider: z
          .enum(["openai", "anthropic", "gemini"])
          .describe("Target LLM provider"),
      },
    },
    async ({ description, provider }) => {
      const ruleSet = getRuleSetByProvider(provider as ProviderId);
      if (!ruleSet) {
        return {
          messages: [{ role: "user" as const, content: { type: "text" as const, text: `Unknown provider: ${provider}` } }],
        };
      }

      const rulesText = formatRuleSetAsText(ruleSet);
      const rootTypes = Array.isArray(ruleSet.rootType) ? ruleSet.rootType.join(" or ") : ruleSet.rootType;

      const prompt = [
        "You are a JSON Schema expert specializing in LLM structured outputs.",
        "",
        "## Task",
        `Generate a JSON schema that is fully compatible with ${ruleSet.provider} (${ruleSet.displayName}) structured output requirements based on the following description.`,
        "",
        "## Desired Schema Description",
        description,
        "",
        "## Provider Rules",
        rulesText,
        "",
        "## Instructions",
        "1. Generate a valid JSON schema that satisfies the description above.",
        "2. The schema MUST comply with every rule and constraint listed in the provider rules.",
        `3. Root type must be ${rootTypes}.`,
        ruleSet.allFieldsRequired
          ? '4. Every property MUST be listed in "required". Use nullable types (e.g. {"type": ["string", "null"]}) for optional fields.'
          : "4. Only list truly required properties in the required array.",
        ruleSet.additionalPropertiesMustBeFalse
          ? '5. Every object MUST have "additionalProperties": false.'
          : ruleSet.additionalPropertiesFalseRecommended
            ? '5. Add "additionalProperties": false to every object (recommended).'
            : '5. "additionalProperties" is optional for this provider.',
        "6. Use only supported keywords for each type. Do NOT use any unsupported keywords.",
        "7. Use description fields to document the purpose of each property.",
        "8. Output ONLY the JSON schema. No explanations before or after the JSON.",
      ].join("\n");

      return {
        messages: [{ role: "user" as const, content: { type: "text" as const, text: prompt } }],
      };
    }
  );
}
