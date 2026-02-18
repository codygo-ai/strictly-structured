import type { AuditContext } from '@ssv/audit';
import { generateEventId } from '@ssv/audit';
import { validateWithGoogle as callGoogle } from '@ssv/providers/google';

import { classifyError } from '../../audit/classify';
import type { ValidationResult } from '../types';

export async function validateWithGoogle(
  schema: object,
  apiKey: string,
  model = 'gemini-2.5-flash',
  audit?: AuditContext,
): Promise<ValidationResult> {
  const schemaSizeBytes = JSON.stringify(schema).length;

  if (audit) {
    audit.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: audit.sessionId,
      traceId: audit.traceId,
      source: 'backend',
      kind: 'llm.call.started',
      data: { provider: 'google', model, schemaHash: audit.schemaHash, schemaSizeBytes },
    });
  }

  const result = await callGoogle(schema, apiKey, model);

  if (audit) {
    audit.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: audit.sessionId,
      traceId: audit.traceId,
      source: 'backend',
      kind: 'llm.call.completed',
      data: {
        provider: 'google',
        model,
        ok: result.ok,
        latencyMs: result.latencyMs,
        ...(result.error
          ? { errorMessage: result.error, errorCategory: classifyError(result.error) }
          : {}),
      },
    });
  }

  return result;
}
