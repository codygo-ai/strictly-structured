// Firestore collection names
export const AUDIT_EVENTS_COLLECTION = 'audit_events';
export const AUDIT_TRACES_COLLECTION = 'audit_traces';
export const AUDIT_SCHEMAS_COLLECTION = 'audit_schemas';

// TTL durations in milliseconds
export const EVENTS_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
export const TRACES_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
export const SCHEMAS_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

// Batching limits
export const BACKEND_BATCH_SIZE = 20;
export const FRONTEND_BUFFER_MAX = 50;
export const FRONTEND_FLUSH_INTERVAL_MS = 10_000;
export const INGEST_MAX_EVENTS = 100;

// Header for session propagation
export const SESSION_HEADER = 'x-audit-session-id';
