import type { AuditContext } from '@ssv/audit';
import { generateEventId } from '@ssv/audit';

import { classifyError } from '../audit/classify';
import type { AuditRequestContext } from '../audit/index';
import { createAuditContext, createTrace, completeTrace, upsertSchema } from '../audit/index';

import { MODEL_MAP } from './model-map';
import { validateWithAnthropic } from './providers/anthropic';
import { validateWithGoogle } from './providers/google';
import { validateWithOpenAI } from './providers/openai';
import type { ValidationResult, ProviderId } from './types';

export type ValidateBody = {
  schema?: string;
  providers?: string[];
  modelIds?: string[];
};

type ValidateSuccess = {
  results: ValidationResult[];
};

type ValidateError = {
  error: string;
};

export async function runValidate(
  body: ValidateBody | undefined,
  apiKeys: Record<string, string | undefined>,
  auditReq?: AuditRequestContext,
): Promise<ValidateSuccess | ValidateError> {
  const schemaRaw = body?.schema;
  if (typeof schemaRaw !== 'string' || !schemaRaw.trim()) {
    return { error: 'Missing or invalid schema' };
  }

  // Parse schema
  let schema: object;
  try {
    schema = JSON.parse(schemaRaw) as object;
  } catch {
    if (auditReq) {
      const ctx = createAuditContext(auditReq.sessionId, auditReq.emitter, schemaRaw);
      ctx.emit({
        eventId: generateEventId(),
        timestamp: new Date().toISOString(),
        sessionId: ctx.sessionId,
        traceId: ctx.traceId,
        source: 'backend',
        kind: 'decision.schema_parse',
        data: { success: false, errorMessage: 'Invalid JSON' },
      });
      await auditReq.emitter.flush();
    }
    return { error: 'Schema is not valid JSON' };
  }

  // Resolve models
  const modelIds = body?.modelIds ?? Object.keys(MODEL_MAP);
  const resolved = modelIds
    .map((id) => MODEL_MAP[id])
    .filter((m): m is { provider: ProviderId; model: string } => m !== null && m !== undefined);

  if (resolved.length === 0) {
    return { error: 'No valid models specified' };
  }

  // Create audit context
  let audit: AuditContext | undefined;
  if (auditReq) {
    audit = createAuditContext(auditReq.sessionId, auditReq.emitter, schemaRaw);

    audit.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: audit.sessionId,
      traceId: audit.traceId,
      source: 'backend',
      kind: 'decision.schema_parse',
      data: { success: true },
    });

    audit.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: audit.sessionId,
      traceId: audit.traceId,
      source: 'backend',
      kind: 'api.validate.received',
      data: {
        schemaHash: audit.schemaHash,
        schemaSizeBytes: Buffer.byteLength(schemaRaw, 'utf8'),
        requestedModelIds: modelIds,
        resolvedModels: resolved.map((m) => ({ provider: m.provider, model: m.model })),
      },
    });

    await createTrace(audit, 'validate', schemaRaw, modelIds);
  }

  const start = Date.now();

  // Run validations in parallel
  const results = await Promise.all(
    resolved.map(({ provider, model }) => {
      const key = apiKeys[provider];
      if (!key) {
        return Promise.resolve<ValidationResult>({
          provider,
          model,
          ok: false,
          latencyMs: 0,
          error: `Missing API key for ${provider}`,
        });
      }
      switch (provider) {
        case 'openai':
          return validateWithOpenAI(schema, key, model, audit);
        case 'anthropic':
          return validateWithAnthropic(schema, key, model, audit);
        case 'google':
          return validateWithGoogle(schema, key, model, audit);
      }
    }),
  );

  const totalLatencyMs = Date.now() - start;
  const successCount = results.filter((r) => r.ok).length;
  const failureCount = results.length - successCount;

  // Complete audit trace
  if (audit) {
    audit.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: audit.sessionId,
      traceId: audit.traceId,
      source: 'backend',
      kind: 'api.validate.response',
      data: {
        httpStatus: 200,
        totalLatencyMs,
        modelResultCount: results.length,
        successCount,
        failureCount,
      },
    });

    const traceResults = results.map((r) => ({
      provider: r.provider,
      model: r.model,
      ok: r.ok,
      latencyMs: r.latencyMs,
      ...(r.error ? { errorCategory: classifyError(r.error) } : {}),
    }));

    await completeTrace(audit.traceId, traceResults, totalLatencyMs);

    const overallSuccess = successCount > 0 && failureCount === 0;
    await upsertSchema(audit.schemaHash, schemaRaw, overallSuccess);
  }

  return { results };
}
