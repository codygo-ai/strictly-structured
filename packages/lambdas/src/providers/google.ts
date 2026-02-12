import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ValidationResult } from "~/types";

const MODEL = "gemini-2.0-flash";
const PROMPT =
  "Return a valid JSON object that matches the given schema. Use minimal placeholder data.";

export async function validateWithGoogle(
  schema: object,
  apiKey: string
): Promise<ValidationResult> {
  const start = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as Record<string, unknown>,
      },
    });
    const result = await model.generateContent(PROMPT);
    const response = result.response;
    if (!response.text()) {
      return {
        provider: "google",
        model: MODEL,
        ok: false,
        latencyMs: Date.now() - start,
        error: "Empty response from model",
      };
    }
    JSON.parse(response.text());
    return {
      provider: "google",
      model: MODEL,
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return {
      provider: "google",
      model: MODEL,
      ok: false,
      latencyMs: Date.now() - start,
      error,
    };
  }
}
