import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ValidationResult } from "~/types";

const DEFAULT_MODEL = "gemini-2.5-flash";
const PROMPT =
  "Return a valid JSON object that matches the given schema. Use minimal placeholder data.";

export async function validateWithGoogle(
  schema: object,
  apiKey: string,
  model: string = DEFAULT_MODEL
): Promise<ValidationResult> {
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
    const response = result.response;
    if (!response.text()) {
      return {
        provider: "google",
        model,
        ok: false,
        latencyMs: Date.now() - start,
        error: "Empty response from model",
      };
    }
    JSON.parse(response.text());
    return {
      provider: "google",
      model,
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return {
      provider: "google",
      model,
      ok: false,
      latencyMs: Date.now() - start,
      error,
    };
  }
}
