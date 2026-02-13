import Anthropic from "@anthropic-ai/sdk";
import type { ValidationResult } from "./types";

const MODEL = "claude-haiku-4-5";
const PROMPT =
  "Return a valid JSON object that matches the given schema. Use minimal placeholder data.";

export async function validateWithAnthropic(
  schema: object,
  apiKey: string
): Promise<ValidationResult> {
  const start = Date.now();
  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: "user", content: PROMPT }],
      tools: [
        {
          name: "output",
          description: "Return the JSON output",
          input_schema: schema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "output" },
    });
    const toolUse = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse || toolUse.name !== "output") {
      return {
        provider: "anthropic",
        model: MODEL,
        ok: false,
        latencyMs: Date.now() - start,
        error: "Model did not return tool use",
      };
    }
    if (typeof toolUse.input === "object" && toolUse.input !== null) {
      return {
        provider: "anthropic",
        model: MODEL,
        ok: true,
        latencyMs: Date.now() - start,
      };
    }
    return {
      provider: "anthropic",
      model: MODEL,
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return {
      provider: "anthropic",
      model: MODEL,
      ok: false,
      latencyMs: Date.now() - start,
      error,
    };
  }
}
