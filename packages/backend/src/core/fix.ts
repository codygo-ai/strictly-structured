import type { AuditRequestContext } from "../audit/index.js";
import { createAuditContext } from "../audit/index.js";
import { generateEventId } from "@ssv/audit";

export type FixIssue = {
  path: string;
  keyword: string;
  message: string;
  suggestion?: string;
};

export type FixSchemaValidityError = { path: string; message: string };

export type FixBody = {
  schema: string;
  modelIds?: string[];
  issues: FixIssue[];
  schemaValidityErrors?: FixSchemaValidityError[];
};

export async function runFix(
  body: FixBody | undefined,
  _openaiApiKey: string | undefined,
  auditReq?: AuditRequestContext,
): Promise<{ suggestedSchema: string } | { error: string }> {
  if (auditReq && body?.schema) {
    const ctx = createAuditContext(auditReq.sessionId, auditReq.emitter, body.schema);
    ctx.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: ctx.sessionId,
      traceId: ctx.traceId,
      source: "backend",
      kind: "api.fix.received",
      data: {
        schemaHash: ctx.schemaHash,
        issueCount: body.issues?.length ?? 0,
      },
    });

    ctx.emit({
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: ctx.sessionId,
      traceId: ctx.traceId,
      source: "backend",
      kind: "api.fix.response",
      data: {
        httpStatus: 501,
        totalLatencyMs: 0,
        success: false,
      },
    });
  }

  return { error: "Not implemented" };
}
