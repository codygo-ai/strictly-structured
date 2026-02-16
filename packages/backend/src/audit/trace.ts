import type { AuditTrace, AuditContext, ErrorCategory } from '@ssv/audit';
import {
  generateTraceId,
  generateEventId,
  hashSchema,
  AUDIT_TRACES_COLLECTION,
  AUDIT_SCHEMAS_COLLECTION,
  TRACES_TTL_MS,
  SCHEMAS_TTL_MS,
} from '@ssv/audit';
import * as admin from 'firebase-admin';

import type { AuditEmitter } from './emitter';

interface TraceResult {
  provider: string;
  model: string;
  ok: boolean;
  latencyMs: number;
  errorCategory?: ErrorCategory;
}

export function createAuditContext(
  sessionId: string,
  emitter: AuditEmitter,
  schemaRaw: string,
): AuditContext {
  const traceId = generateTraceId();
  const schemaHash = hashSchema(schemaRaw);
  return {
    traceId,
    sessionId,
    schemaHash,
    emit: (event) => emitter.emit(event),
  };
}

export function emitEvent(
  ctx: AuditContext,
  kind: string,
  source: 'backend',
  data: Record<string, unknown>,
): void {
  ctx.emit({
    eventId: generateEventId(),
    timestamp: new Date().toISOString(),
    sessionId: ctx.sessionId,
    traceId: ctx.traceId,
    source,
    kind,
    data,
  } as Parameters<AuditContext['emit']>[0]);
}

export async function createTrace(
  ctx: AuditContext,
  operation: 'validate' | 'fix',
  schemaRaw: string,
  modelIds: readonly string[],
): Promise<void> {
  const db = admin.firestore();
  const now = new Date().toISOString();

  const trace: Omit<
    AuditTrace,
    'completedAt' | 'results' | 'totalLatencyMs' | 'overallSuccess' | 'clientValidationErrors'
  > & {
    completedAt?: string;
    results: TraceResult[];
    totalLatencyMs: number;
    overallSuccess: boolean;
    clientValidationErrors: number;
    expiresAt: admin.firestore.Timestamp;
  } = {
    traceId: ctx.traceId,
    sessionId: ctx.sessionId,
    startedAt: now,
    schemaHash: ctx.schemaHash,
    schemaSizeBytes: Buffer.byteLength(schemaRaw, 'utf8'),
    operation,
    modelIds,
    clientValidationErrors: 0,
    results: [],
    totalLatencyMs: 0,
    overallSuccess: false,
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + TRACES_TTL_MS)),
  };

  await db.collection(AUDIT_TRACES_COLLECTION).doc(ctx.traceId).set(trace);
}

export async function completeTrace(
  traceId: string,
  results: TraceResult[],
  totalLatencyMs: number,
): Promise<void> {
  const db = admin.firestore();
  const overallSuccess = results.length > 0 && results.every((r) => r.ok);

  await db.collection(AUDIT_TRACES_COLLECTION).doc(traceId).update({
    completedAt: new Date().toISOString(),
    results,
    totalLatencyMs,
    overallSuccess,
  });
}

export async function upsertSchema(
  schemaHash: string,
  schemaText: string,
  success: boolean,
): Promise<void> {
  const db = admin.firestore();
  const ref = db.collection(AUDIT_SCHEMAS_COLLECTION).doc(schemaHash);
  const now = new Date().toISOString();
  const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + SCHEMAS_TTL_MS));

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (doc.exists) {
      const data = doc.data()!;
      const total = (data.totalValidations as number) + 1;
      const oldRate = data.successRate as number;
      const successRate = oldRate + ((success ? 1 : 0) - oldRate) / total;
      tx.update(ref, {
        lastSeenAt: now,
        totalValidations: total,
        successRate,
        expiresAt,
      });
    } else {
      tx.set(ref, {
        schemaHash,
        schemaText,
        firstSeenAt: now,
        lastSeenAt: now,
        totalValidations: 1,
        successRate: success ? 1 : 0,
        expiresAt,
      });
    }
  });
}
