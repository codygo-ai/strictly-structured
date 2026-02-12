/**
 * Provider calls matching web app semantics. Schema must be plain object (no _meta).
 */

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

const PROMPT =
  "Return a valid JSON object that matches the given schema. Use minimal placeholder data.";

export type ProviderId = "openai" | "google" | "anthropic";

export interface RunResult {
  ok: boolean;
  error?: string;
  latencyMs: number;
}

export async function runOpenAI(
  schema: object,
  model: string,
  apiKey: string
): Promise<RunResult> {
  const start = Date.now();
  const openai = new OpenAI({ apiKey });
  try {
    await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: "Generate a minimal valid instance." },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "validator_schema",
          strict: true,
          schema: schema as Record<string, unknown>,
        },
      },
    });
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      latencyMs: Date.now() - start,
    };
  }
}

export async function runGoogle(
  schema: object,
  model: string,
  apiKey: string
): Promise<RunResult> {
  const start = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const m = genAI.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as Record<string, unknown>,
      },
    });
    const result = await m.generateContent(PROMPT);
    const text = result.response.text();
    if (!text) {
      return {
        ok: false,
        error: "Empty response",
        latencyMs: Date.now() - start,
      };
    }
    JSON.parse(text);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      latencyMs: Date.now() - start,
    };
  }
}

export async function runAnthropic(
  schema: object,
  model: string,
  apiKey: string
): Promise<RunResult> {
  const start = Date.now();
  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model,
      max_tokens: 256,
      messages: [{ role: "user", content: PROMPT }],
      tools: [
        {
          name: "output",
          description: "Return the JSON output",
          input_schema: schema as Record<string, unknown>,
        },
      ],
      tool_choice: { type: "tool", name: "output" },
    });
    const toolUse = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse || toolUse.name !== "output") {
      return {
        ok: false,
        error: "Model did not return tool use",
        latencyMs: Date.now() - start,
      };
    }
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      latencyMs: Date.now() - start,
    };
  }
}

const RUNNERS = {
  openai: runOpenAI,
  google: runGoogle,
  anthropic: runAnthropic,
} as const;

export function runProvider(
  provider: ProviderId,
  schema: object,
  model: string,
  apiKey: string
): Promise<RunResult> {
  return RUNNERS[provider](schema, model, apiKey);
}
