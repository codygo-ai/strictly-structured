import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRuleSetsByProviders } from "../lib/ruleSets";
import { validateSchemaForRuleSet } from "@ssv/schemas/ruleSetValidator";
import type { ProviderId, ProviderValidationResult, ValidateSchemaResponse } from "../lib/types";

export function registerValidateSchemaTool(server: McpServer): void {
  server.tool(
    "validate_schema",
    "Validate a JSON schema for LLM structured outputs against provider rules (OpenAI, Anthropic, Gemini). Returns per-provider compatibility results with exact error locations.",
    {
      schema: z.string().describe("The JSON schema to validate, as a JSON string"),
      providers: z
        .array(z.enum(["openai", "anthropic", "gemini"]))
        .optional()
        .describe("Provider rule sets to validate against. Defaults to all providers if omitted."),
    },
    async ({ schema, providers }) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(schema);
      } catch {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Invalid JSON", results: [], summary: "Input is not valid JSON." }, undefined, 2) }],
          isError: true,
        };
      }

      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Schema must be a JSON object", results: [], summary: "Schema must be a JSON object, not a primitive or array." }, undefined, 2) }],
          isError: true,
        };
      }

      const ruleSets = getRuleSetsByProviders(providers as ProviderId[] | undefined);
      const results: ProviderValidationResult[] = ruleSets.map((ruleSet) => {
        const markers = validateSchemaForRuleSet(schema, ruleSet);
        const errors = markers.filter((m) => m.severity === "error");
        const warnings = markers.filter((m) => m.severity === "warning");
        const infos = markers.filter((m) => m.severity === "info");

        return {
          provider: ruleSet.providerId,
          ruleSetId: ruleSet.ruleSetId,
          displayName: ruleSet.displayName,
          valid: errors.length === 0,
          errors: errors.map((m) => ({
            message: m.message,
            severity: m.severity,
            location: { line: m.startLineNumber, column: m.startColumn },
          })),
          warnings: warnings.map((m) => ({
            message: m.message,
            severity: m.severity,
            location: { line: m.startLineNumber, column: m.startColumn },
          })),
          infos: infos.map((m) => ({
            message: m.message,
            severity: m.severity,
            location: { line: m.startLineNumber, column: m.startColumn },
          })),
        };
      });

      const validProviders = results.filter((r) => r.valid).map((r) => r.provider);
      const invalidProviders = results.filter((r) => !r.valid).map((r) => r.provider);
      const summary =
        validProviders.length === results.length
          ? `Valid for all ${results.length} providers.`
          : invalidProviders.length === results.length
            ? `Invalid for all ${results.length} providers.`
            : `Valid for ${validProviders.length}/${results.length} providers (${validProviders.join(", ")}). Issues found for: ${invalidProviders.join(", ")}.`;

      const response: ValidateSchemaResponse = { results, summary };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, undefined, 2) }],
      };
    }
  );
}
