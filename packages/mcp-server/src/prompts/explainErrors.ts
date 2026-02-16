import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRuleSetByProvider, getRuleSets } from "../lib/ruleSets";
import { validateSchemaForRuleSet } from "@ssv/schemas/ruleSetValidator";
import { formatRuleSetAsText, formatMarkersAsText } from "../lib/formatRules";
import type { ProviderId } from "../lib/types";

export function registerExplainErrorsPrompt(server: McpServer): void {
  server.registerPrompt(
    "explain-errors",
    {
      title: "Explain Schema Validation Errors",
      description:
        "Validates a JSON schema against provider rules and asks the LLM to explain each error in plain language with fix suggestions.",
      argsSchema: {
        schema: z.string().describe("The JSON schema to validate, as a JSON string"),
        provider: z
          .enum(["openai", "anthropic", "gemini"])
          .optional()
          .describe("Target provider. Validates against all providers if omitted."),
      },
    },
    async ({ schema, provider }) => {
      const singleRuleSet = provider ? getRuleSetByProvider(provider as ProviderId) : undefined;
      const ruleSets = provider
        ? (singleRuleSet ? [singleRuleSet] : [])
        : getRuleSets();

      if (ruleSets.length === 0) {
        return {
          messages: [{ role: "user" as const, content: { type: "text" as const, text: `Unknown provider: ${provider}` } }],
        };
      }

      let isValidJson = true;
      try { JSON.parse(schema); } catch { isValidJson = false; }

      const providerSections = ruleSets.map((ruleSet) => {
        const markers = isValidJson ? validateSchemaForRuleSet(schema, ruleSet) : [];
        const errorsText = isValidJson
          ? formatMarkersAsText(markers)
          : "Schema is not valid JSON. Fix JSON syntax before validating against provider rules.";
        const rulesText = formatRuleSetAsText(ruleSet);

        return [
          `### ${ruleSet.provider} (${ruleSet.displayName})`,
          "",
          "#### Validation Results",
          errorsText,
          "",
          "#### Provider Rules",
          rulesText,
        ].join("\n");
      });

      const prompt = [
        "You are a JSON Schema expert specializing in LLM structured outputs.",
        "",
        "## Task",
        "Explain each validation error below in plain, beginner-friendly language. For each error, provide:",
        "- What the error means",
        "- Why the provider requires this",
        "- How to fix it (with a concrete code snippet)",
        "",
        "## Schema",
        "```json",
        schema,
        "```",
        "",
        ...providerSections,
        "",
        "## Instructions",
        "1. Address every error and warning listed above.",
        "2. Group your explanations by provider if multiple providers are shown.",
        "3. Use clear, non-technical language where possible.",
        "4. For each fix suggestion, show the specific JSON change needed.",
        "5. If the schema has no errors for a provider, say so explicitly.",
      ].join("\n");

      return {
        messages: [{ role: "user" as const, content: { type: "text" as const, text: prompt } }],
      };
    }
  );
}
