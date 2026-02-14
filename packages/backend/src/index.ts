import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { runValidate, runFix, type ValidateBody, type FixBody, type ProviderId } from "./core/index.js";
import { createAuditRequestContext } from "./audit/index.js";
import { createFirestoreEmitter } from "./audit/emitter.js";
import type { AuditEvent } from "@ssv/audit";
import { INGEST_MAX_EVENTS } from "@ssv/audit";

if (!admin.apps.length) {
  admin.initializeApp();
}

const IS_EMULATOR = process.env.FUNCTIONS_EMULATOR === "true";

const OPENAI_API_KEY_SECRET = defineSecret("OPENAI_API_KEY");
const GOOGLE_GENERATIVE_AI_API_KEY_SECRET = defineSecret("GOOGLE_GENERATIVE_AI_API_KEY");
const ANTHROPIC_API_KEY_SECRET = defineSecret("ANTHROPIC_API_KEY");

function getApiKeys(): Record<ProviderId, string | undefined> {
  if (IS_EMULATOR) {
    return {
      openai: process.env.OPENAI_API_KEY,
      google: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    };
  }
  return {
    openai: OPENAI_API_KEY_SECRET.value(),
    google: GOOGLE_GENERATIVE_AI_API_KEY_SECRET.value(),
    anthropic: ANTHROPIC_API_KEY_SECRET.value(),
  };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-audit-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function setCors(res: { set: (h: Record<string, string>) => void }) {
  if (IS_EMULATOR) res.set(CORS);
}

async function requireAuth(req: { headers: { authorization?: string } }): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const idToken = auth.slice(7).trim();
  if (!idToken) return null;
  try {
    await admin.auth().verifyIdToken(idToken);
    return idToken;
  } catch {
    return null;
  }
}

function send401(res: { set: (h: Record<string, string>) => void; status: (n: number) => { json: (b: object) => void } }) {
  setCors(res);
  res.status(401).json({ error: "Authentication required. Sign in to use this feature." });
}

/**
 * Validate JSON schema against LLM providers. Requires Firebase Auth.
 */
export const validate = onRequest(
  {
    cors: IS_EMULATOR,
    invoker: "public",
    secrets: IS_EMULATOR ? [] : [OPENAI_API_KEY_SECRET, GOOGLE_GENERATIVE_AI_API_KEY_SECRET, ANTHROPIC_API_KEY_SECRET],
  },
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

    let body: ValidateBody;
    try {
      const raw =
        req.body != null
          ? typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body)
          : (req.rawBody?.toString() ?? "{}");
      body = raw ? (JSON.parse(raw) as ValidateBody) : {};
    } catch {
      res.status(400).set("Content-Type", "application/json").json({ error: "Invalid JSON body" });
      return;
    }

    const auditCtx = createAuditRequestContext(req);
    const apiKeys = getApiKeys();
    const result = await runValidate(body, apiKeys, auditCtx);
    await auditCtx.emitter.flush();

    if ("error" in result) {
      const status = result.error === "Not implemented" ? 501 : 400;
      res.status(status).set("Content-Type", "application/json").json({ error: result.error });
      return;
    }
    res.status(200).set("Content-Type", "application/json").json({ results: result.results });
  }
);

/**
 * Auto-fix schema. Requires Firebase Auth.
 */
export const fix = onRequest(
  {
    cors: IS_EMULATOR,
    invoker: "public",
    secrets: IS_EMULATOR ? [] : [OPENAI_API_KEY_SECRET, GOOGLE_GENERATIVE_AI_API_KEY_SECRET, ANTHROPIC_API_KEY_SECRET],
  },
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

    let body: FixBody;
    try {
      const raw =
        req.body != null
          ? typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body)
          : (req.rawBody?.toString() ?? "{}");
      body = raw ? (JSON.parse(raw) as FixBody) : {} as FixBody;
    } catch {
      res.status(400).set("Content-Type", "application/json").json({ error: "Invalid JSON body" });
      return;
    }

    if (typeof body.schema !== "string" || !Array.isArray(body.issues)) {
      res.status(400).set("Content-Type", "application/json").json({ error: "Missing or invalid schema / issues" });
      return;
    }

    const auditCtx = createAuditRequestContext(req);
    const apiKeys = getApiKeys();
    const result = await runFix(body, apiKeys.openai, auditCtx);
    await auditCtx.emitter.flush();

    if ("error" in result) {
      const status = result.error === "Not implemented" ? 501 : 400;
      res.status(status).set("Content-Type", "application/json").json({ error: result.error });
      return;
    }
    res.status(200).set("Content-Type", "application/json").json({ suggestedSchema: result.suggestedSchema });
  }
);

/**
 * Ingest anonymous audit events from the frontend.
 * No auth required — events contain no PII.
 */
export const evaluate = onRequest(
  {
    cors: IS_EMULATOR,
    invoker: "public",
  },
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

    let parsed: { events?: unknown };
    try {
      const raw =
        req.body != null
          ? typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body)
          : "{}";
      parsed = JSON.parse(raw) as { events?: unknown };
    } catch {
      res.status(400).set("Content-Type", "application/json").json({ error: "Invalid JSON body" });
      return;
    }

    const events = parsed.events;
    if (!Array.isArray(events) || events.length === 0 || events.length > INGEST_MAX_EVENTS) {
      res.status(400).set("Content-Type", "application/json").json({
        error: `Expected events array with 1-${INGEST_MAX_EVENTS} items`,
      });
      return;
    }

    const emitter = createFirestoreEmitter();
    for (const event of events) {
      emitter.emit(event as AuditEvent);
    }
    await emitter.flush();

    res.status(202).set("Content-Type", "application/json").json({ accepted: events.length });
  }
);
