/**
 * Legacy compatibility data types for devops/compatibility-runner.
 * Exported so compatibility-runner can depend on @ssv/schemas instead of @ssv/schema-utils.
 */

export interface ModelResult {
  supported: string[];
  failed: Record<string, string>;
  supported_keywords: string[];
  provider?: string;
  model?: string;
}

export interface KeywordRule {
  allowed?: boolean;
  severity?: 'error' | 'warning' | 'info';
  requirement?: string;
  errorMessage?: string;
  suggestion?: string;
  note?: string;
}

export interface CompatibilityGroup {
  id: string;
  provider: string;
  modelIds: string[];
  representative: string;
  displayName?: string;
  note?: string;
  keywordRules?: Record<string, KeywordRule>;
  sampleSchema?: string;
}
