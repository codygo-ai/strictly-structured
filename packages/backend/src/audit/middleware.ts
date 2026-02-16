import { generateSessionId, SESSION_HEADER } from '@ssv/audit';

import { createFirestoreEmitter, type AuditEmitter } from './emitter';

/** Minimal request shape for extracting the session header */
interface HasHeaders {
  headers: Record<string, string | string[] | undefined>;
}

export interface AuditRequestContext {
  readonly emitter: AuditEmitter;
  readonly sessionId: string;
}

export function createAuditRequestContext(req: HasHeaders): AuditRequestContext {
  const emitter = createFirestoreEmitter();
  const raw = req.headers[SESSION_HEADER];
  const sessionId = (typeof raw === 'string' ? raw : undefined) ?? generateSessionId();
  return { emitter, sessionId };
}
