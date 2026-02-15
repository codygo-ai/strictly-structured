import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  zodToJsonSchema,
  jsonSchemaToZod,
  detectFormat,
} from "@ssv/codegen";
import type { InputFormat } from "@ssv/codegen";

export function registerConvertCodeTool(server: McpServer): void {
  server.tool(
    "convert_code",
    "Convert between Zod code, Pydantic code, and JSON Schema. Supports bidirectional conversion.",
    {
      code: z.string().describe("The source code or schema to convert"),
      from: z
        .enum(["zod", "pydantic", "json-schema"])
        .optional()
        .describe("Source format. Auto-detected if omitted."),
      to: z
        .enum(["zod", "pydantic", "json-schema"])
        .describe("Target format to convert to"),
    },
    async ({ code, from, to }) => {
      const sourceFormat: InputFormat = from ?? detectFormat(code);

      if (sourceFormat === to) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                result: code,
                warnings: [{ message: "Source and target formats are the same", severity: "info" }],
              }, undefined, 2),
            },
          ],
        };
      }

      try {
        if (sourceFormat === "zod" && to === "json-schema") {
          const conversion = zodToJsonSchema(code);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  result: JSON.stringify(conversion.schema, undefined, 2),
                  warnings: conversion.warnings,
                  unsupported: conversion.unsupported,
                }, undefined, 2),
              },
            ],
          };
        }

        if (sourceFormat === "json-schema" && to === "zod") {
          const schema = JSON.parse(code) as Record<string, unknown>;
          const zodCode = jsonSchemaToZod(schema);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ result: zodCode, warnings: [] }, undefined, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: sourceFormat === "pydantic" || to === "pydantic"
                  ? "Pydantic conversion requires Python runtime. Paste the output of YourModel.model_json_schema() as JSON Schema input."
                  : `Unsupported conversion: ${sourceFormat} → ${to}`,
              }, undefined, 2),
            },
          ],
          isError: true,
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
