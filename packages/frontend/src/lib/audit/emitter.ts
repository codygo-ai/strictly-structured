import type { AuditEventKind } from '@ssv/audit/browser';
import {
  FRONTEND_BUFFER_MAX,
  FRONTEND_FLUSH_INTERVAL_MS,
  SESSION_HEADER,
} from '@ssv/audit/browser';

import { getOrCreateSessionId } from './session';

const AUDIT_ENDPOINT = '/api/evaluate';

interface BufferedEvent {
  eventId: string;
  timestamp: string;
  sessionId: string;
  traceId: string;
  source: 'frontend';
  kind: AuditEventKind;
  data: Record<string, unknown>;
}

const buffer: BufferedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | undefined;
let started = false;

export function emit(kind: AuditEventKind, data: Record<string, unknown>, traceId = ''): void {
  buffer.push({
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sessionId: getOrCreateSessionId(),
    traceId,
    source: 'frontend',
    kind,
    data,
  });

  if (buffer.length >= FRONTEND_BUFFER_MAX) {
    void flush();
  }
}

export async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const toSend = buffer.splice(0);
  try {
    await fetch(AUDIT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SESSION_HEADER]: getOrCreateSessionId(),
      },
      body: JSON.stringify({ events: toSend }),
      keepalive: true,
    });
  } catch {
    // Re-queue on failure (best effort)
    buffer.unshift(...toSend);
  }
}

export function startAutoFlush(): void {
  if (started) return;
  started = true;
  flushTimer = setInterval(() => void flush(), FRONTEND_FLUSH_INTERVAL_MS);

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void flush();
      }
    });
  }
}

export function stopAutoFlush(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = undefined;
  }
  started = false;
  void flush();
}
