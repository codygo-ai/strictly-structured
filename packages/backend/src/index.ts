import type { AuditEvent } from '@ssv/audit';
import { INGEST_MAX_EVENTS } from '@ssv/audit';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';

import { createFirestoreEmitter } from './audit/emitter';
import { createAuditRequestContext } from './audit/index';
import {
  runValidate,
  runFix,
  type ValidateBody,
  type FixBody,
  type ProviderId,
} from './core/index';

if (!admin.apps.length) {
  admin.initializeApp();
}

const IS_EMULATOR = process.env.FUNCTIONS_EMULATOR === 'true';

const OPENAI_API_KEY_SECRET = defineSecret('OPENAI_API_KEY');
const GOOGLE_GENERATIVE_AI_API_KEY_SECRET = defineSecret('GOOGLE_GENERATIVE_AI_API_KEY');
const ANTHROPIC_API_KEY_SECRET = defineSecret('ANTHROPIC_API_KEY');
const GITHUB_PAT_SECRET = defineSecret('GITHUB_PAT');

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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-audit-session-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function setCors(res: { set: (h: Record<string, string>) => void }) {
  if (IS_EMULATOR) res.set(CORS);
}

async function requireAuth(req: { headers: { authorization?: string } }): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const idToken = auth.slice(7).trim();
  if (!idToken) return null;
  try {
    await admin.auth().verifyIdToken(idToken);
    return idToken;
  } catch {
    return null;
  }
}

function send401(res: {
  set: (h: Record<string, string>) => void;
  status: (n: number) => { json: (b: object) => void };
}) {
  setCors(res);
  res.status(401).json({ error: 'Authentication required. Sign in to use this feature.' });
}

/**
 * Validate JSON schema against LLM providers. Requires Firebase Auth.
 */
export const validate = onRequest(
  {
    cors: IS_EMULATOR,
    invoker: 'public',
    secrets: IS_EMULATOR
      ? []
      : [OPENAI_API_KEY_SECRET, GOOGLE_GENERATIVE_AI_API_KEY_SECRET, ANTHROPIC_API_KEY_SECRET],
  },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).set('Content-Type', 'application/json').json({ error: 'Method not allowed' });
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
        req.body !== null && req.body !== undefined
          ? typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body)
          : (req.rawBody?.toString() ?? '{}');
      body = raw ? (JSON.parse(raw) as ValidateBody) : {};
    } catch {
      res.status(400).set('Content-Type', 'application/json').json({ error: 'Invalid JSON body' });
      return;
    }

    const auditCtx = createAuditRequestContext(req);
    const apiKeys = getApiKeys();
    const result = await runValidate(body, apiKeys, auditCtx);
    await auditCtx.emitter.flush();

    if ('error' in result) {
      const status = result.error === 'Not implemented' ? 501 : 400;
      res.status(status).set('Content-Type', 'application/json').json({ error: result.error });
      return;
    }
    res.status(200).set('Content-Type', 'application/json').json({ results: result.results });
  },
);

/**
 * Auto-fix schema. Requires Firebase Auth.
 */
export const fix = onRequest(
  {
    cors: IS_EMULATOR,
    invoker: 'public',
    secrets: IS_EMULATOR
      ? []
      : [OPENAI_API_KEY_SECRET, GOOGLE_GENERATIVE_AI_API_KEY_SECRET, ANTHROPIC_API_KEY_SECRET],
  },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).set('Content-Type', 'application/json').json({ error: 'Method not allowed' });
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
        req.body !== null && req.body !== undefined
          ? typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body)
          : (req.rawBody?.toString() ?? '{}');
      body = JSON.parse(raw || '{}') as FixBody;
    } catch {
      res.status(400).set('Content-Type', 'application/json').json({ error: 'Invalid JSON body' });
      return;
    }

    if (typeof body.schema !== 'string' || !Array.isArray(body.issues)) {
      res
        .status(400)
        .set('Content-Type', 'application/json')
        .json({ error: 'Missing or invalid schema / issues' });
      return;
    }

    const auditCtx = createAuditRequestContext(req);
    const apiKeys = getApiKeys();
    const result = await runFix(body, apiKeys.openai, auditCtx);
    await auditCtx.emitter.flush();

    if ('error' in result) {
      const status = result.error === 'Not implemented' ? 501 : 400;
      res.status(status).set('Content-Type', 'application/json').json({ error: result.error });
      return;
    }
    res
      .status(200)
      .set('Content-Type', 'application/json')
      .json({ suggestedSchema: result.suggestedSchema });
  },
);

/**
 * Ingest anonymous audit events from the frontend.
 * No auth required — events contain no PII.
 */
export const evaluate = onRequest(
  {
    cors: IS_EMULATOR,
    invoker: 'public',
  },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).set('Content-Type', 'application/json').json({ error: 'Method not allowed' });
      return;
    }

    let parsed: { events?: unknown };
    try {
      const raw =
        req.body !== null && req.body !== undefined
          ? typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body)
          : '{}';
      parsed = JSON.parse(raw) as { events?: unknown };
    } catch {
      res.status(400).set('Content-Type', 'application/json').json({ error: 'Invalid JSON body' });
      return;
    }

    const events = parsed.events;
    if (!Array.isArray(events) || events.length === 0 || events.length > INGEST_MAX_EVENTS) {
      res
        .status(400)
        .set('Content-Type', 'application/json')
        .json({
          error: `Expected events array with 1-${INGEST_MAX_EVENTS} items`,
        });
      return;
    }

    const emitter = createFirestoreEmitter();
    for (const event of events) {
      emitter.emit(event as AuditEvent);
    }
    await emitter.flush();

    res.status(202).set('Content-Type', 'application/json').json({ accepted: events.length });
  },
);

interface FeedbackBody {
  type: string;
  description: string;
  email?: string;
  website?: string;
  page?: string;
}

const FEEDBACK_TYPES = ['bug', 'feature', 'general'] as const;
const FEEDBACK_LABEL_MAP: Record<string, string> = {
  bug: 'bug',
  feature: 'enhancement',
  general: 'feedback',
};

export const feedback = onRequest(
  {
    cors: IS_EMULATOR,
    invoker: 'public',
    secrets: IS_EMULATOR ? [] : [GITHUB_PAT_SECRET],
  },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).set('Content-Type', 'application/json').json({ error: 'Method not allowed' });
      return;
    }

    let body: FeedbackBody;
    try {
      const raw =
        req.body !== null && req.body !== undefined
          ? typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body)
          : (req.rawBody?.toString() ?? '{}');
      body = JSON.parse(raw || '{}') as FeedbackBody;
    } catch {
      res.status(400).set('Content-Type', 'application/json').json({ error: 'Invalid JSON body' });
      return;
    }

    // Honeypot — silently accept to not reveal the check
    if (body.website) {
      res.status(200).set('Content-Type', 'application/json').json({ ok: true });
      return;
    }

    if (!body.type || !(FEEDBACK_TYPES as readonly string[]).includes(body.type)) {
      res
        .status(400)
        .set('Content-Type', 'application/json')
        .json({ error: 'Invalid feedback type' });
      return;
    }
    if (
      !body.description ||
      typeof body.description !== 'string' ||
      body.description.trim().length < 5
    ) {
      res
        .status(400)
        .set('Content-Type', 'application/json')
        .json({ error: 'Description too short (min 5 chars)' });
      return;
    }
    if (body.description.length > 5000) {
      res
        .status(400)
        .set('Content-Type', 'application/json')
        .json({ error: 'Description too long (max 5000 chars)' });
      return;
    }

    const ghToken = IS_EMULATOR ? process.env.GITHUB_PAT : GITHUB_PAT_SECRET.value();
    if (!ghToken) {
      res
        .status(500)
        .set('Content-Type', 'application/json')
        .json({ error: 'GitHub integration not configured' });
      return;
    }

    const typeLabel = FEEDBACK_LABEL_MAP[body.type] ?? 'feedback';
    const title = `[${body.type}] ${body.description.trim().slice(0, 80)}`;
    const issueBody = [
      `**Type:** ${body.type}`,
      `**Page:** ${body.page ?? 'unknown'}`,
      body.email ? `**Email:** ${body.email}` : '',
      '',
      '---',
      '',
      body.description.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const ghRes = await fetch(
        'https://api.github.com/repos/codygo-ai/structured-schema-validator/issues',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            title,
            body: issueBody,
            labels: [typeLabel, 'user-feedback'],
          }),
        },
      );
      if (!ghRes.ok) {
        const errText = await ghRes.text();
        throw new Error(`GitHub API ${ghRes.status}: ${errText}`);
      }
      res.status(200).set('Content-Type', 'application/json').json({ ok: true });
    } catch (err) {
      res
        .status(502)
        .set('Content-Type', 'application/json')
        .json({
          error: `Failed to create issue: ${(err as Error).message}`,
        });
    }
  },
);
