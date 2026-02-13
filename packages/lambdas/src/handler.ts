import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { parseSchema } from "~/schemas";
import { validateWithOpenAI } from "~/providers/openai";
import { validateWithGoogle } from "~/providers/google";
import { validateWithAnthropic } from "~/providers/anthropic";
import type { ProviderId } from "~/types";
import { MODEL_MAP } from "~/model-map";

export type ValidateBody = {
  schema?: string;
  providers?: string[];
  modelIds?: string[];
};

type ValidateFn = (
  schema: object,
  apiKey: string,
  model?: string
) => Promise<{ provider: string; model: string; ok: boolean; latencyMs: number; error?: string }>;

const RUNNERS: Record<ProviderId, ValidateFn> = {
  openai: validateWithOpenAI,
  google: validateWithGoogle,
  anthropic: validateWithAnthropic,
};

function getApiKeys(): Record<ProviderId, string | undefined> {
  return {
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };
}

/**
 * Framework-agnostic validate: parses body, runs schema validation against providers.
 * Used by both the Lambda handler and the Firebase HTTP function.
 */
export async function runValidate(
  body: ValidateBody
): Promise<{ results: Array<{ provider: string; model: string; ok: boolean; latencyMs: number; error?: string }> } | { error: string }> {
  const { schema: raw, providers: providerIds, modelIds } = body;
  if (typeof raw !== "string") {
    return { error: "Missing or invalid 'schema' (string)" };
  }

  const parsed = parseSchema(raw);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const schema = parsed.schema;

  const API_KEYS = getApiKeys();
  const targets: Array<{ provider: ProviderId; model?: string }> = [];
  if (Array.isArray(modelIds) && modelIds.length > 0) {
    for (const id of modelIds) {
      const entry = typeof id === "string" ? MODEL_MAP[id] : undefined;
      if (entry) targets.push({ provider: entry.provider, model: entry.model });
    }
  }
  if (targets.length === 0) {
    const providers: ProviderId[] = Array.isArray(providerIds)
      ? (providerIds.filter((p): p is ProviderId =>
          ["openai", "google", "anthropic"].includes(p)
        ))
      : ["openai", "google", "anthropic"];
    for (const id of providers) {
      targets.push({ provider: id });
    }
  }

  const results = await Promise.all(
    targets.map(async (t) => {
      const key = API_KEYS[t.provider];
      if (!key) {
        return {
          provider: t.provider,
          model: t.model ?? "-",
          ok: false,
          latencyMs: 0,
          error: "API key not configured",
        };
      }
      return RUNNERS[t.provider](schema, key, t.model);
    })
  );

  return { results };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {}
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...headers },
    body: JSON.stringify(body),
  };
}

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.requestContext?.http?.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let body: ValidateBody;
  try {
    const raw = event.body;
    const str =
      typeof raw === "string"
        ? event.isBase64Encoded
          ? Buffer.from(raw, "base64").toString("utf-8")
          : raw
        : "";
    body = str ? JSON.parse(str) : {};
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const result = await runValidate(body);
  if ("error" in result) {
    return jsonResponse(400, { error: result.error });
  }
  return jsonResponse(200, { results: result.results });
}

export { runFix } from "~/fix";
export type { FixBody, FixIssue, FixSchemaValidityError } from "~/fix";
