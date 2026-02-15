import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRuleSetByProvider } from "../lib/groups";
import { validateSchemaForRuleSet } from "../lib/validator";
import { fixSchemaForRuleSet } from "../lib/fixer";
import { formatRuleSetAsText, formatMarkersAsText } from "../lib/formatRules";
import type { ProviderId } from "../lib/types";

export function registerFixSchemaPrompt(server: McpServer): void {
  server.registerPrompt(
    "fix-schema",
    {
      title: "Fix JSON Schema for Provider",
      description:
        "Applies mechanical fixes to a JSON schema, then asks the LLM to resolve remaining semantic issues using full provider rules.",
      argsSchema: {
        schema: z.string().describe("The JSON schema to fix, as a JSON string"),
        provider: z
          .enum(["openai", "anthropic", "gemini"])
          .describe("Target LLM provider"),
      },
    },
    async ({ schema, provider }) => {
      const ruleSet = getRuleSetByProvider(provider as ProviderId);
      if (!ruleSet) {
        return {
          messages: [{ role: "user" as const, content: { type: "text" as const, text: `Unknown provider: ${provider}` } }],
        };
      }

      const markers = validateSchemaForRuleSet(schema, ruleSet);
      const fixResult = fixSchemaForRuleSet(schema, ruleSet);
      const rulesText = formatRuleSetAsText(ruleSet);
      const errorsText = formatMarkersAsText(markers);

      const appliedFixesList = fixResult.appliedFixes.length > 0
        ? fixResult.appliedFixes.map((f, i) => `${i + 1}. ${f}`).join("\n")
        : "None";

      const remainingIssuesList = fixResult.remainingIssues.length > 0
        ? fixResult.remainingIssues.map((r, i) => `${i + 1}. ${r}`).join("\n")
        : "None";

      const prompt = [
        "You are a JSON Schema expert specializing in LLM structured outputs.",
        "",
        "## Task",
        `Fix the following JSON schema to be fully compatible with ${ruleSet.provider} (${ruleSet.displayName}) structured output requirements.`,
        "",
        "## Original Schema",
        "```json",
        schema,
        "```",
        "",
        "## Validation Errors (from original schema)",
        errorsText,
        "",
        "## Mechanical Fixes Already Applied",
        appliedFixesList,
        "",
        "## Mechanically Fixed Schema",
        "```json",
        fixResult.fixedSchema,
        "```",
        "",
        "## Remaining Issues (cannot be fixed mechanically)",
        remainingIssuesList,
        "",
        "## Provider Rules",
        rulesText,
        "",
        "## Instructions",
        "1. Start from the mechanically fixed schema above.",
        "2. Resolve every remaining issue listed above using the provider rules.",
        '3. If unsupported keywords cannot be removed without losing semantics, move their intent into a "description" field.',
        "4. Preserve the original schema's intent and structure as much as possible.",
        "5. Output ONLY the final, corrected JSON schema. No explanations before or after the JSON.",
      ].join("\n");

      return {
        messages: [{ role: "user" as const, content: { type: "text" as const, text: prompt } }],
      };
    }
  );
}
