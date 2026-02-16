import { createHash } from 'node:crypto';

export function generateEventId(): string {
  return crypto.randomUUID();
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function generateTraceId(): string {
  return crypto.randomUUID();
}

export function hashSchema(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
