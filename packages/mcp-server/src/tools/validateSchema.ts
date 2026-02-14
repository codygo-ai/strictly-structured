import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGroupsByProviders } from "../lib/groups";
import { validateSchemaForGroup } from "../lib/validator";
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
        .describe("Provider groups to validate against. Defaults to all providers if omitted."),
    },
    async ({ schema, providers }) => {
      const groups = getGroupsByProviders(providers as ProviderId[] | undefined);
      const results: ProviderValidationResult[] = groups.map((group) => {
        const markers = validateSchemaForGroup(schema, group);
        const errors = markers.filter((m) => m.severity === "error");
        const warnings = markers.filter((m) => m.severity === "warning");
        const infos = markers.filter((m) => m.severity === "info");

        return {
          provider: group.providerId,
          groupId: group.groupId,
          groupName: group.groupName,
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
