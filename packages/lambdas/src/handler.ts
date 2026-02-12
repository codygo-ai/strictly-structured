import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { parseSchema } from "~/schemas";
import { validateWithOpenAI } from "~/providers/openai";
import { validateWithGoogle } from "~/providers/google";
import { validateWithAnthropic } from "~/providers/anthropic";
import type { ProviderId } from "~/types";
import { MODEL_MAP } from "~/model-map";

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

const API_KEYS: Record<ProviderId, string | undefined> = {
  openai: process.env.OPENAI_API_KEY,
  google: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
};

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

  let body: { schema?: string; providers?: string[]; modelIds?: string[] };
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

  const { schema: raw, providers: providerIds, modelIds } = body;
  if (typeof raw !== "string") {
    return jsonResponse(400, { error: "Missing or invalid 'schema' (string)" });
  }

  const parsed = parseSchema(raw);
  if (!parsed.ok) {
    return jsonResponse(400, { error: parsed.error });
  }
  const schema = parsed.schema;

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

  return jsonResponse(200, { results });
}
