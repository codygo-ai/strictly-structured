import type { AuditEvent } from '@ssv/audit';
import { AUDIT_EVENTS_COLLECTION, BACKEND_BATCH_SIZE, EVENTS_TTL_MS } from '@ssv/audit';
import * as admin from 'firebase-admin';

export interface AuditEmitter {
  emit(event: AuditEvent): void;
  flush(): Promise<void>;
}

export function createFirestoreEmitter(): AuditEmitter {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const buffer: AuditEvent[] = [];
  const db = admin.firestore();

  function emit(event: AuditEvent): void {
    buffer.push(event);
    if (buffer.length >= BACKEND_BATCH_SIZE) {
      void flush();
    }
  }

  async function flush(): Promise<void> {
    if (buffer.length === 0) return;
    const toFlush = buffer.splice(0, BACKEND_BATCH_SIZE);
    const batch = db.batch();
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + EVENTS_TTL_MS));
    for (const event of toFlush) {
      const ref = db.collection(AUDIT_EVENTS_COLLECTION).doc(event.eventId);
      batch.set(ref, { ...event, expiresAt });
    }
    await batch.commit();

    // Flush remaining if buffer still has items
    if (buffer.length > 0) {
      await flush();
    }
  }

  return { emit, flush };
}
