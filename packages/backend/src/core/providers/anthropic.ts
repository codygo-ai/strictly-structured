import type { AuditContext } from '@ssv/audit';
import { generateEventId } from '@ssv/audit';
import { validateWithAnthropic as callAnthropic } from '@ssv/providers/anthropic';

import { classifyError } from '../../audit/classify';
import type { ValidationResult } from '../types';

export async function validateWithAnthropic(
  schema: object,
  apiKey: string,
  model = 'claude-haiku-4-5',
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
      data: { provider: 'anthropic', model, schemaHash: audit.schemaHash, schemaSizeBytes },
    });
  }

  const result = await callAnthropic(schema, apiKey, model);

  if (audit) {
    audit.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: audit.sessionId,
      traceId: audit.traceId,
      source: 'backend',
      kind: 'llm.call.completed',
      data: {
        provider: 'anthropic',
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
