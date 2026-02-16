// ---------------------------------------------------------------------------
// Event source
// ---------------------------------------------------------------------------

const EVENT_SOURCES = ["frontend", "backend"] as const;
type EventSource = (typeof EVENT_SOURCES)[number];

// ---------------------------------------------------------------------------
// Common envelope shared by every audit event
// ---------------------------------------------------------------------------

interface AuditEventBase {
  readonly eventId: string;
  readonly timestamp: string;
  readonly sessionId: string;
  readonly traceId: string;
  readonly source: EventSource;
}

// ---------------------------------------------------------------------------
// Error category (for LLM call classification)
// ---------------------------------------------------------------------------

const ERROR_CATEGORIES = [
  "api_error",
  "invalid_schema",
  "timeout",
  "rate_limit",
  "model_error",
  "auth_error",
  "unknown",
] as const;
type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Frontend events
// ---------------------------------------------------------------------------

interface SchemaEditedEvent extends AuditEventBase {
  readonly kind: "schema.edited";
  readonly source: "frontend";
  readonly data: {
    readonly schemaHash: string;
    readonly schemaSizeBytes: number;
    readonly isValidJson: boolean;
  };
}

interface RuleSetSelectedEvent extends AuditEventBase {
  readonly kind: "ruleSet.selected";
  readonly source: "frontend";
  readonly data: {
    readonly ruleSetId: string;
  };
}

interface ClientValidationEvent extends AuditEventBase {
  readonly kind: "client.validation";
  readonly source: "frontend";
  readonly data: {
    readonly ruleSetId: string;
    readonly schemaHash: string;
    readonly markerCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
    readonly infoCount: number;
    readonly markerSample: readonly string[];
  };
}

interface ServerValidateRequestedEvent extends AuditEventBase {
  readonly kind: "server.validate.requested";
  readonly source: "frontend";
  readonly data: {
    readonly schemaHash: string;
    readonly schemaSizeBytes: number;
    readonly modelIds: readonly string[];
  };
}

interface ServerValidateCompletedEvent extends AuditEventBase {
  readonly kind: "server.validate.completed";
  readonly source: "frontend";
  readonly data: {
    readonly totalLatencyMs: number;
    readonly resultCount: number;
    readonly successCount: number;
    readonly failureCount: number;
  };
}

interface FixRequestedEvent extends AuditEventBase {
  readonly kind: "fix.requested";
  readonly source: "frontend";
  readonly data: {
    readonly schemaHash: string;
    readonly issueCount: number;
  };
}

interface FixCompletedEvent extends AuditEventBase {
  readonly kind: "fix.completed";
  readonly source: "frontend";
  readonly data: {
    readonly success: boolean;
    readonly totalLatencyMs: number;
  };
}

interface FixAcceptedEvent extends AuditEventBase {
  readonly kind: "fix.accepted";
  readonly source: "frontend";
  readonly data: {
    readonly schemaHash: string;
    readonly suggestedSchemaHash: string;
  };
}

interface FixRejectedEvent extends AuditEventBase {
  readonly kind: "fix.rejected";
  readonly source: "frontend";
  readonly data: {
    readonly schemaHash: string;
  };
}

interface SchemaLoadedEvent extends AuditEventBase {
  readonly kind: "schema.loaded";
  readonly source: "frontend";
  readonly data: {
    readonly method: "file_upload" | "drag_drop" | "paste";
    readonly schemaSizeBytes: number;
  };
}

type FrontendEvent =
  | SchemaEditedEvent
  | RuleSetSelectedEvent
  | ClientValidationEvent
  | ServerValidateRequestedEvent
  | ServerValidateCompletedEvent
  | FixRequestedEvent
  | FixCompletedEvent
  | FixAcceptedEvent
  | FixRejectedEvent
  | SchemaLoadedEvent;

// ---------------------------------------------------------------------------
// Backend events
// ---------------------------------------------------------------------------

interface ValidateRequestReceivedEvent extends AuditEventBase {
  readonly kind: "api.validate.received";
  readonly source: "backend";
  readonly data: {
    readonly schemaHash: string;
    readonly schemaSizeBytes: number;
    readonly requestedModelIds: readonly string[];
    readonly resolvedModels: readonly { provider: string; model: string }[];
  };
}

interface SchemaParseDecisionEvent extends AuditEventBase {
  readonly kind: "decision.schema_parse";
  readonly source: "backend";
  readonly data: {
    readonly success: boolean;
    readonly errorMessage?: string;
  };
}

interface LlmCallStartedEvent extends AuditEventBase {
  readonly kind: "llm.call.started";
  readonly source: "backend";
  readonly data: {
    readonly provider: string;
    readonly model: string;
    readonly schemaHash: string;
    readonly schemaSizeBytes: number;
  };
}

interface LlmCallCompletedEvent extends AuditEventBase {
  readonly kind: "llm.call.completed";
  readonly source: "backend";
  readonly data: {
    readonly provider: string;
    readonly model: string;
    readonly ok: boolean;
    readonly latencyMs: number;
    readonly errorMessage?: string;
    readonly errorCategory?: ErrorCategory;
    readonly responseSizeBytes?: number;
  };
}

interface ValidateResponseSentEvent extends AuditEventBase {
  readonly kind: "api.validate.response";
  readonly source: "backend";
  readonly data: {
    readonly httpStatus: number;
    readonly totalLatencyMs: number;
    readonly modelResultCount: number;
    readonly successCount: number;
    readonly failureCount: number;
  };
}

interface FixRequestReceivedEvent extends AuditEventBase {
  readonly kind: "api.fix.received";
  readonly source: "backend";
  readonly data: {
    readonly schemaHash: string;
    readonly issueCount: number;
  };
}

interface FixLlmCallCompletedEvent extends AuditEventBase {
  readonly kind: "llm.fix.completed";
  readonly source: "backend";
  readonly data: {
    readonly ok: boolean;
    readonly latencyMs: number;
    readonly errorMessage?: string;
  };
}

interface FixResponseSentEvent extends AuditEventBase {
  readonly kind: "api.fix.response";
  readonly source: "backend";
  readonly data: {
    readonly httpStatus: number;
    readonly totalLatencyMs: number;
    readonly success: boolean;
  };
}

type BackendEvent =
  | ValidateRequestReceivedEvent
  | SchemaParseDecisionEvent
  | LlmCallStartedEvent
  | LlmCallCompletedEvent
  | ValidateResponseSentEvent
  | FixRequestReceivedEvent
  | FixLlmCallCompletedEvent
  | FixResponseSentEvent;

// ---------------------------------------------------------------------------
// Unified discriminated union
// ---------------------------------------------------------------------------

type AuditEvent = FrontendEvent | BackendEvent;

type AuditEventKind = AuditEvent["kind"];

// ---------------------------------------------------------------------------
// Trace document (written to audit_traces collection)
// ---------------------------------------------------------------------------

interface AuditTrace {
  readonly traceId: string;
  readonly sessionId: string;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly schemaHash: string;
  readonly schemaSizeBytes: number;
  readonly operation: "validate" | "fix";
  readonly modelIds: readonly string[];
  readonly clientValidationErrors: number;
  readonly results: readonly {
    provider: string;
    model: string;
    ok: boolean;
    latencyMs: number;
    errorCategory?: ErrorCategory;
  }[];
  readonly totalLatencyMs: number;
  readonly overallSuccess: boolean;
}

// ---------------------------------------------------------------------------
// Schema document (written to audit_schemas collection)
// ---------------------------------------------------------------------------

interface AuditSchema {
  readonly schemaHash: string;
  readonly schemaText: string;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly totalValidations: number;
  readonly successRate: number;
}

// ---------------------------------------------------------------------------
// Audit context passed through backend functions
// ---------------------------------------------------------------------------

interface AuditContext {
  readonly traceId: string;
  readonly sessionId: string;
  readonly schemaHash: string;
  readonly emit: (event: AuditEvent) => void;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  EVENT_SOURCES,
  ERROR_CATEGORIES,
};

export type {
  EventSource,
  ErrorCategory,
  AuditEventBase,
  SchemaEditedEvent,
  RuleSetSelectedEvent,
  ClientValidationEvent,
  ServerValidateRequestedEvent,
  ServerValidateCompletedEvent,
  FixRequestedEvent,
  FixCompletedEvent,
  FixAcceptedEvent,
  FixRejectedEvent,
  SchemaLoadedEvent,
  FrontendEvent,
  ValidateRequestReceivedEvent,
  SchemaParseDecisionEvent,
  LlmCallStartedEvent,
  LlmCallCompletedEvent,
  ValidateResponseSentEvent,
  FixRequestReceivedEvent,
  FixLlmCallCompletedEvent,
  FixResponseSentEvent,
  BackendEvent,
  AuditEvent,
  AuditEventKind,
  AuditTrace,
  AuditSchema,
  AuditContext,
};
