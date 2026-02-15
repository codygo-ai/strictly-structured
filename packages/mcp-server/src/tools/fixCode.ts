import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  zodToJsonSchema,
  jsonSchemaToZod,
  detectFormat,
} from "@ssv/codegen";
import { getRuleSetByProvider } from "../lib/groups";
import { fixSchemaForRuleSet } from "@ssv/schemas/ruleSetFixer";
import type { ProviderId } from "../lib/types";

export function registerFixCodeTool(server: McpServer): void {
  server.tool(
    "fix_code",
    "Fix Zod or Pydantic code to make it compatible with a specific LLM provider. Converts to JSON Schema, applies fixes, then converts back to original language.",
    {
      code: z.string().describe("Zod or Pydantic code to fix"),
      format: z
        .enum(["zod", "pydantic"])
        .optional()
        .describe("Code format. Auto-detected if omitted."),
      provider: z
        .enum(["openai", "anthropic", "gemini"])
        .describe("Target provider to fix for"),
    },
    async ({ code, format, provider }) => {
      try {
        const detectedFormat = format ?? detectFormat(code);

        if (detectedFormat === "json-schema") {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Input looks like JSON Schema. Use fix_schema instead, which accepts raw JSON Schema directly.",
                }, undefined, 2),
              },
            ],
            isError: true,
          };
        }

        if (detectedFormat === "pydantic") {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Pydantic code fixing requires Python runtime. Paste JSON Schema and use fix_schema instead.",
                }, undefined, 2),
              },
            ],
            isError: true,
          };
        }

        const ruleSet = getRuleSetByProvider(provider as ProviderId);
        if (!ruleSet) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: `Unknown provider: ${provider}` }, undefined, 2),
              },
            ],
            isError: true,
          };
        }

        const conversion = zodToJsonSchema(code);

        const fixResult = fixSchemaForRuleSet(
          conversion.schema as Record<string, unknown>,
          ruleSet,
        );

        const fixedZodCode = jsonSchemaToZod(
          fixResult.fixedSchema as Record<string, unknown>,
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                fixedCode: fixedZodCode,
                fixedSchema: fixResult.fixedSchema,
                appliedFixes: fixResult.appliedFixes.map((f) => f.description),
                remainingIssues: fixResult.unresolvedErrors.map((e) => e.message),
                conversionWarnings: conversion.warnings,
              }, undefined, 2),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ error: message }, undefined, 2) },
          ],
          isError: true,
        };
      }
    },
  );
}
