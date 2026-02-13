import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { runValidate, runFix, type ValidateBody, type FixBody } from "@ssv/lambdas";

if (!admin.apps.length) {
  admin.initializeApp();
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function setCors(res: { set: (headers: Record<string, string>) => void }) {
  res.set(CORS_HEADERS);
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

function send401(res: { set: (h: Record<string, string>) => void; status: (code: number) => { json: (b: object) => void } }) {
  res.set(CORS_HEADERS);
  res.status(401).json({ error: "Authentication required. Sign in to use this feature." });
}

/**
 * Validate JSON schema against LLM providers. Requires Firebase Auth.
 */
export const validate = onRequest(
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

    const result = await runValidate(body);
    if ("error" in result) {
      res.status(400).set("Content-Type", "application/json").json({ error: result.error });
      return;
    }
    res.status(200).set("Content-Type", "application/json").json({ results: result.results });
  }
);

/**
 * Auto-fix schema: send issues + model context to a cheap model, return suggested schema. Requires Firebase Auth.
 */
export const fix = onRequest(
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

    const result = await runFix(body);
    if ("error" in result) {
      res.status(400).set("Content-Type", "application/json").json({ error: result.error });
      return;
    }
    res.status(200).set("Content-Type", "application/json").json({ suggestedSchema: result.suggestedSchema });
  }
);
