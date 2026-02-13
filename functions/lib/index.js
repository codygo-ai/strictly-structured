// src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// ../packages/lambdas/dist/handler.js
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI2 from "openai";
function parseSchema(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    return { ok: false, error: message };
  }
  if (parsed === null || typeof parsed !== "object") {
    return { ok: false, error: "Schema must be a JSON object" };
  }
  return { ok: true, schema: parsed };
}
var DEFAULT_MODEL = "gpt-4.1-mini";
var PROMPT = "Return a valid JSON object that matches the given schema. Use minimal placeholder data.";
async function validateWithOpenAI(schema, apiKey, model = DEFAULT_MODEL) {
  const start = Date.now();
  const openai = new OpenAI({ apiKey });
  try {
    await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: "Generate a minimal valid instance." }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "validator_schema",
          strict: true,
          schema
        }
      }
    });
    return {
      provider: "openai",
      model,
      ok: true,
      latencyMs: Date.now() - start
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return {
      provider: "openai",
      model,
      ok: false,
      latencyMs: Date.now() - start,
      error
    };
  }
}
var DEFAULT_MODEL2 = "gemini-2.5-flash";
var PROMPT2 = "Return a valid JSON object that matches the given schema. Use minimal placeholder data.";
async function validateWithGoogle(schema, apiKey, model = DEFAULT_MODEL2) {
  const start = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const m = genAI.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    const result = await m.generateContent(PROMPT2);
    const response = result.response;
    if (!response.text()) {
      return {
        provider: "google",
        model,
        ok: false,
        latencyMs: Date.now() - start,
        error: "Empty response from model"
      };
    }
    JSON.parse(response.text());
    return {
      provider: "google",
      model,
      ok: true,
      latencyMs: Date.now() - start
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return {
      provider: "google",
      model,
      ok: false,
      latencyMs: Date.now() - start,
      error
    };
  }
}
var DEFAULT_MODEL3 = "claude-haiku-4-5";
var PROMPT3 = "Return a valid JSON object that matches the given schema. Use minimal placeholder data.";
async function validateWithAnthropic(schema, apiKey, model = DEFAULT_MODEL3) {
  const start = Date.now();
  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model,
      max_tokens: 256,
      messages: [{ role: "user", content: PROMPT3 }],
      tools: [
        {
          name: "output",
          description: "Return the JSON output",
          input_schema: { type: "object", ...schema }
        }
      ],
      tool_choice: { type: "tool", name: "output" }
    });
    const toolUse = message.content.find(
      (b) => b.type === "tool_use"
    );
    if (!toolUse || toolUse.name !== "output") {
      return {
        provider: "anthropic",
        model,
        ok: false,
        latencyMs: Date.now() - start,
        error: "Model did not return tool use"
      };
    }
    return {
      provider: "anthropic",
      model,
      ok: true,
      latencyMs: Date.now() - start
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return {
      provider: "anthropic",
      model,
      ok: false,
      latencyMs: Date.now() - start,
      error
    };
  }
}
var MODEL_MAP = {
  "openai:gpt-4.1-mini": { provider: "openai", model: "gpt-4.1-mini" },
  "openai:gpt-5-mini": { provider: "openai", model: "gpt-5-mini" },
  "openai:gpt-5-nano": { provider: "openai", model: "gpt-5-nano" },
  "openai:gpt-5.2": { provider: "openai", model: "gpt-5.2" },
  "openai:gpt-5.1": { provider: "openai", model: "gpt-5.1" },
  "openai:gpt-5": { provider: "openai", model: "gpt-5" },
  "openai:gpt-5.2-pro": { provider: "openai", model: "gpt-5.2-pro" },
  "openai:gpt-5-pro": { provider: "openai", model: "gpt-5-pro" },
  "openai:gpt-4.1": { provider: "openai", model: "gpt-4.1" },
  "google:gemini-3-pro-preview": {
    provider: "google",
    model: "gemini-3-pro-preview"
  },
  "google:gemini-3-flash-preview": {
    provider: "google",
    model: "gemini-3-flash-preview"
  },
  "google:gemini-2.5-flash": { provider: "google", model: "gemini-2.5-flash" },
  "google:gemini-2.5-flash-lite": {
    provider: "google",
    model: "gemini-2.5-flash-lite"
  },
  "google:gemini-2.5-pro": { provider: "google", model: "gemini-2.5-pro" },
  "anthropic:claude-haiku-4-5": {
    provider: "anthropic",
    model: "claude-haiku-4-5"
  },
  "anthropic:claude-sonnet-4-5": {
    provider: "anthropic",
    model: "claude-sonnet-4-5"
  },
  "anthropic:claude-opus-4-6": {
    provider: "anthropic",
    model: "claude-opus-4-6"
  },
  "anthropic:claude-3-5-haiku": {
    provider: "anthropic",
    model: "claude-3-5-haiku-20241022"
  }
};
var FIX_MODEL = "gpt-4.1-mini";
function buildFixPrompt(body) {
  const parts = [
    "You are a JSON Schema expert. Fix the following JSON Schema so it is valid and compatible with the target model(s).",
    "",
    "Current schema (JSON):",
    "```json",
    body.schema,
    "```"
  ];
  if (body.schemaValidityErrors && body.schemaValidityErrors.length > 0) {
    parts.push("", "Schema validity errors (fix these first):");
    for (const e of body.schemaValidityErrors) {
      parts.push(`- ${e.path ? e.path + ": " : ""}${e.message}`);
    }
  }
  if (body.issues.length > 0) {
    parts.push("", "Compatibility issues for the selected model(s):");
    for (const i of body.issues) {
      parts.push(
        `- ${i.path ? i.path + ": " : ""}[${i.keyword}] ${i.message}` + (i.suggestion ? ` (suggestion: ${i.suggestion})` : "")
      );
    }
  }
  if (body.modelIds && body.modelIds.length > 0) {
    parts.push(
      "",
      "Target model(s): " + body.modelIds.join(", "),
      "Use only keywords and patterns supported by these models."
    );
  }
  parts.push(
    "",
    "Respond with ONLY the fixed JSON Schema as a single JSON object. No markdown, no explanation, no code fence."
  );
  return parts.join("\n");
}
async function runFix(body) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { error: "OPENAI_API_KEY not configured" };
  }
  const trimmed = (body.schema || "").trim();
  if (!trimmed) {
    return { error: "Missing or invalid 'schema' (string)" };
  }
  const parsed = parseSchema(trimmed);
  if (!parsed.ok) {
    return { error: `Invalid schema JSON: ${parsed.error}` };
  }
  const prompt = buildFixPrompt(body);
  const openai = new OpenAI2({ apiKey });
  try {
    const completion = await openai.chat.completions.create({
      model: FIX_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });
    const content = completion.choices[0]?.message?.content?.trim().replace(/^```json\s*|\s*```$/g, "").trim() ?? "";
    if (!content) {
      return { error: "Model returned empty response" };
    }
    try {
      const obj = JSON.parse(content);
      const suggestedSchema = JSON.stringify(obj, null, 2);
      return { suggestedSchema };
    } catch {
      return { error: "Model response was not valid JSON" };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: message };
  }
}
var RUNNERS = {
  openai: validateWithOpenAI,
  google: validateWithGoogle,
  anthropic: validateWithAnthropic
};
function getApiKeys() {
  return {
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY
  };
}
async function runValidate(body) {
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
  const targets = [];
  if (Array.isArray(modelIds) && modelIds.length > 0) {
    for (const id of modelIds) {
      const entry = typeof id === "string" ? MODEL_MAP[id] : void 0;
      if (entry) targets.push({ provider: entry.provider, model: entry.model });
    }
  }
  if (targets.length === 0) {
    const providers = Array.isArray(providerIds) ? providerIds.filter(
      (p) => ["openai", "google", "anthropic"].includes(p)
    ) : ["openai", "google", "anthropic"];
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
          error: "API key not configured"
        };
      }
      return RUNNERS[t.provider](schema, key, t.model);
    })
  );
  return { results };
}

// src/index.ts
if (!admin.apps.length) {
  admin.initializeApp();
}
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function setCors(res) {
  res.set(CORS_HEADERS);
}
async function requireAuth(req) {
  const auth2 = req.headers.authorization;
  if (!auth2?.startsWith("Bearer ")) return null;
  const idToken = auth2.slice(7).trim();
  if (!idToken) return null;
  try {
    await admin.auth().verifyIdToken(idToken);
    return idToken;
  } catch {
    return null;
  }
}
function send401(res) {
  res.set(CORS_HEADERS);
  res.status(401).json({ error: "Authentication required. Sign in to use this feature." });
}
var validate = onRequest(
  { cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    if (req.method !== "POST") {
      res.status(405).set("Content-Type", "application/json").json({ error: "Method not allowed" });
      return;
    }
    const _token = await requireAuth(req);
    if (!_token) {
      send401(res);
      return;
    }
    let body;
    try {
      const raw = req.body != null ? typeof req.body === "string" ? req.body : JSON.stringify(req.body) : req.rawBody?.toString() ?? "{}";
      body = raw ? JSON.parse(raw) : {};
    } catch {
      res.status(400).set("Content-Type", "application/json").json({ error: "Invalid JSON body" });
      return;
    }
    const result = await runValidate(body);
    if ("error" in result) {
      res.status(400).set("Content-Type", "application/json").json({ error: result.error });
      return;
    }
    res.status(200).set("Content-Type", "application/json").json({ results: result.results });
  }
);
var fix = onRequest(
  { cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    if (req.method !== "POST") {
      res.status(405).set("Content-Type", "application/json").json({ error: "Method not allowed" });
      return;
    }
    const _token = await requireAuth(req);
    if (!_token) {
      send401(res);
      return;
    }
    let body;
    try {
      const raw = req.body != null ? typeof req.body === "string" ? req.body : JSON.stringify(req.body) : req.rawBody?.toString() ?? "{}";
      body = raw ? JSON.parse(raw) : {};
    } catch {
      res.status(400).set("Content-Type", "application/json").json({ error: "Invalid JSON body" });
      return;
    }
    if (typeof body.schema !== "string" || !Array.isArray(body.issues)) {
      res.status(400).set("Content-Type", "application/json").json({ error: "Missing or invalid schema / issues" });
      return;
    }
    const result = await runFix(body);
    if ("error" in result) {
      res.status(400).set("Content-Type", "application/json").json({ error: result.error });
      return;
    }
    res.status(200).set("Content-Type", "application/json").json({ suggestedSchema: result.suggestedSchema });
  }
);
export {
  fix,
  validate
};
