import Anthropic from '@anthropic-ai/sdk';
import type { AuditContext } from '@ssv/audit';
import { generateEventId } from '@ssv/audit';

import { classifyError } from '../../audit/classify';
import type { ValidationResult } from '../types';

const DEFAULT_MODEL = 'claude-haiku-4-5';
const PROMPT =
  'Return a valid JSON object that matches the given schema. Use minimal placeholder data.';

export async function validateWithAnthropic(
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
      data: { provider: 'anthropic', model, schemaHash: audit.schemaHash, schemaSizeBytes },
    });
  }

  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model,
      max_tokens: 256,
      messages: [{ role: 'user', content: PROMPT }],
      tools: [
        {
          name: 'output',
          description: 'Return the JSON output',
          input_schema: { type: 'object' as const, ...schema } satisfies {
            type: 'object';
            [key: string]: unknown;
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'output' },
    });
    const toolUse = message.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');

    if (!toolUse || toolUse.name !== 'output') {
      const errorMsg = 'Model did not return tool use';
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
            provider: 'anthropic',
            model,
            ok: false,
            latencyMs,
            errorMessage: errorMsg,
            errorCategory: 'model_error' as const,
          },
        });
      }

      return {
        provider: 'anthropic',
        model,
        ok: false,
        latencyMs,
        error: errorMsg,
      };
    }

    const result: ValidationResult = {
      provider: 'anthropic',
      model,
      ok: true,
      latencyMs: Date.now() - start,
    };

    if (audit) {
      const responseText = JSON.stringify(toolUse.input);
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
          provider: 'anthropic',
          model,
          ok: false,
          latencyMs,
          errorMessage: error,
          errorCategory: classifyError(error),
        },
      });
    }

    return {
      provider: 'anthropic',
      model,
      ok: false,
      latencyMs,
      error,
    };
  }
}
