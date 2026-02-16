import type { ErrorCategory } from '@ssv/audit';

export function classifyError(error: string): ErrorCategory {
  const lower = error.toLowerCase();
  if (lower.includes('timeout') || lower.includes('timed out')) return 'timeout';
  if (lower.includes('rate limit') || lower.includes('429')) return 'rate_limit';
  if (lower.includes('invalid') && lower.includes('schema')) return 'invalid_schema';
  if (lower.includes('401') || lower.includes('403') || lower.includes('auth')) return 'auth_error';
  if (lower.includes('api') || lower.includes('500') || lower.includes('503')) return 'api_error';
  if (lower.includes('model') || lower.includes('not found')) return 'model_error';
  return 'unknown';
}
