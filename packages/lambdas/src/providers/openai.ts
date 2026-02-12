import OpenAI from "openai";
import type { ValidationResult } from "~/types";

const DEFAULT_MODEL = "gpt-4.1-mini";
const PROMPT =
  "Return a valid JSON object that matches the given schema. Use minimal placeholder data.";

export async function validateWithOpenAI(
  schema: object,
  apiKey: string,
  model: string = DEFAULT_MODEL
): Promise<ValidationResult> {
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
    return {
      provider: "openai",
      model,
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return {
      provider: "openai",
      model,
      ok: false,
      latencyMs: Date.now() - start,
      error,
    };
  }
}
