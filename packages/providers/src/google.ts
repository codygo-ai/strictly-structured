import type { Schema as GoogleSchema } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';

import type { ProviderResult } from './types';

const PROMPT =
  'Return a valid JSON object that matches the given schema. Use minimal placeholder data.';

export async function validateWithGoogle(
  schema: object,
  apiKey: string,
  model: string,
): Promise<ProviderResult> {
  const start = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const m = genAI.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema as unknown as GoogleSchema,
      },
    });

    const result = await m.generateContent(PROMPT);
    const text = result.response.text();

    if (!text) {
      return {
        provider: 'google',
        model,
        ok: false,
        latencyMs: Date.now() - start,
        error: 'Empty response from model',
      };
    }

    JSON.parse(text);
    return { provider: 'google', model, ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return {
      provider: 'google',
      model,
      ok: false,
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
