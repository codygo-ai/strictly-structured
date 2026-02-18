import type { AuditContext } from '@ssv/audit';
import { generateEventId } from '@ssv/audit';
import { validateWithOpenAI as callOpenAI } from '@ssv/providers/openai';

import { classifyError } from '../../audit/classify';
import type { ValidationResult } from '../types';

export async function validateWithOpenAI(
  schema: object,
  apiKey: string,
  model = 'gpt-4.1-mini',
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
      data: { provider: 'openai', model, schemaHash: audit.schemaHash, schemaSizeBytes },
    });
  }

  const result = await callOpenAI(schema, apiKey, model);

  if (audit) {
    audit.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: audit.sessionId,
      traceId: audit.traceId,
      source: 'backend',
      kind: 'llm.call.completed',
      data: {
        provider: 'openai',
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
