import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  zodToJsonSchema,
  simulateSdkTransform,
  detectFormat,
  SDK_IDS,
} from "@ssv/codegen";
import type { SdkId } from "@ssv/codegen";

export function registerPreviewSdkTransformTool(server: McpServer): void {
  server.tool(
    "preview_sdk_transform",
    "Show exactly what an SDK/framework sends to the provider API. Accepts JSON Schema or Zod code. Returns original schema, transformed schema, detailed diff of changes, and gap analysis.",
    {
      code: z.string().describe("JSON Schema (as string) or Zod code"),
      format: z
        .enum(["json-schema", "zod", "pydantic"])
        .optional()
        .describe("Input format. Auto-detected if omitted."),
      sdk: z
        .enum(SDK_IDS)
        .describe("The SDK/framework to simulate"),
    },
    async ({ code, format, sdk }) => {
      try {
        const detectedFormat = format ?? detectFormat(code);

        let schema: Record<string, unknown>;

        if (detectedFormat === "zod") {
          const conversion = zodToJsonSchema(code);
          schema = conversion.schema;
        } else if (detectedFormat === "json-schema") {
          schema = JSON.parse(code) as Record<string, unknown>;
        } else {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Pydantic input requires Python runtime. Paste JSON Schema instead.",
                }, undefined, 2),
              },
            ],
            isError: true,
          };
        }

        const result = simulateSdkTransform(schema, sdk as SdkId);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                sdk: result.sdk,
                original: result.original,
                transformed: result.transformed,
                changes: result.changes,
                gaps: result.gaps,
                summary: result.changes.length === 0
                  ? "No transforms applied — schema sent as-is."
                  : `${result.changes.length} transform(s) applied. ${result.gaps.length} gap(s) detected.`,
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
