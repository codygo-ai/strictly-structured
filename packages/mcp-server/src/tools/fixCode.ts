import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  zodToJsonSchema,
  jsonSchemaToZod,
  detectFormat,
} from "@ssv/codegen";
import { getGroupByProvider } from "../lib/groups";
import { fixSchemaForGroup } from "../lib/fixer";
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

        const group = getGroupByProvider(provider as ProviderId);
        if (!group) {
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

        // Step 1: Convert Zod → JSON Schema
        const conversion = zodToJsonSchema(code);
        const rawSchemaStr = JSON.stringify(conversion.schema, undefined, 2);

        // Step 2: Apply fixes to JSON Schema
        const fixResult = fixSchemaForGroup(rawSchemaStr, group);

        // Step 3: Convert fixed JSON Schema back to Zod
        const fixedSchema = JSON.parse(fixResult.fixedSchema) as Record<string, unknown>;
        const fixedZodCode = jsonSchemaToZod(fixedSchema);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                fixedCode: fixedZodCode,
                fixedSchema,
                appliedFixes: fixResult.appliedFixes,
                remainingIssues: fixResult.remainingIssues,
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
