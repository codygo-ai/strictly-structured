import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AuditContext } from "@ssv/audit";
import { generateEventId } from "@ssv/audit";
import type { ValidationResult } from "../types.js";
import { classifyError } from "../../audit/classify.js";

const DEFAULT_MODEL = "gemini-2.5-flash";
const PROMPT =
  "Return a valid JSON object that matches the given schema. Use minimal placeholder data.";

export async function validateWithGoogle(
  schema: object,
  apiKey: string,
  model: string = DEFAULT_MODEL,
  audit?: AuditContext,
): Promise<ValidationResult> {
  const start = Date.now();
  const schemaSizeBytes = JSON.stringify(schema).length;

  if (audit) {
    audit.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: audit.sessionId,
      traceId: audit.traceId,
      source: "backend",
      kind: "llm.call.started",
      data: { provider: "google", model, schemaHash: audit.schemaHash, schemaSizeBytes },
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const m = genAI.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as unknown as import("@google/generative-ai").Schema,
      },
    });
    const result = await m.generateContent(PROMPT);
    const response = result.response;
    if (!response.text()) {
      const errorMsg = "Empty response from model";
      const latencyMs = Date.now() - start;

      if (audit) {
        audit.emit({
          eventId: generateEventId(),
          timestamp: new Date().toISOString(),
          sessionId: audit.sessionId,
          traceId: audit.traceId,
          source: "backend",
          kind: "llm.call.completed",
          data: {
            provider: "google",
            model,
            ok: false,
            latencyMs,
            errorMessage: errorMsg,
            errorCategory: "model_error" as const,
          },
        });
      }

      return {
        provider: "google",
        model,
        ok: false,
        latencyMs,
        error: errorMsg,
      };
    }

    const responseText = response.text();
    JSON.parse(responseText);

    const validResult: ValidationResult = {
      provider: "google",
      model,
      ok: true,
      latencyMs: Date.now() - start,
    };

    if (audit) {
      audit.emit({
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        sessionId: audit.sessionId,
        traceId: audit.traceId,
        source: "backend",
        kind: "llm.call.completed",
        data: {
          provider: "google",
          model,
          ok: true,
          latencyMs: validResult.latencyMs,
          responseSizeBytes: Buffer.byteLength(responseText, "utf8"),
        },
      });
    }

    return validResult;
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    const latencyMs = Date.now() - start;

    if (audit) {
      audit.emit({
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        sessionId: audit.sessionId,
        traceId: audit.traceId,
        source: "backend",
        kind: "llm.call.completed",
        data: {
          provider: "google",
          model,
          ok: false,
          latencyMs,
          errorMessage: error,
          errorCategory: classifyError(error),
        },
      });
    }

    return {
      provider: "google",
      model,
      ok: false,
      latencyMs,
      error,
    };
  }
}
