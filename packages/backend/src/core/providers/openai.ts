import type { AuditContext } from '@ssv/audit';
import { generateEventId } from '@ssv/audit';
import OpenAI from 'openai';

import { classifyError } from '../../audit/classify';
import type { ValidationResult } from '../types';

const DEFAULT_MODEL = 'gpt-4.1-mini';
const PROMPT =
  'Return a valid JSON object that matches the given schema. Use minimal placeholder data.';

export async function validateWithOpenAI(
  schema: object,
  apiKey: string,
  model: string = DEFAULT_MODEL,
  audit?: AuditContext,
): Promise<ValidationResult> {
  const start = Date.now();
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

  const openai = new OpenAI({ apiKey });
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: 'Generate a minimal valid instance.' },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'validator_schema',
          strict: true,
          schema: schema as Record<string, unknown>,
        },
      },
    });

    const result: ValidationResult = {
      provider: 'openai',
      model,
      ok: true,
      latencyMs: Date.now() - start,
    };

    if (audit) {
      const responseText = completion.choices[0]?.message?.content ?? '';
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
          ok: true,
          latencyMs: result.latencyMs,
          responseSizeBytes: Buffer.byteLength(responseText, 'utf8'),
        },
      });
    }

    return result;
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    const latencyMs = Date.now() - start;

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
          ok: false,
          latencyMs,
          errorMessage: error,
          errorCategory: classifyError(error),
        },
      });
    }

    return {
      provider: 'openai',
      model,
      ok: false,
      latencyMs,
      error,
    };
  }
}
