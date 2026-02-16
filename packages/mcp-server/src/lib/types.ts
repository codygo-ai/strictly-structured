export interface ValidationIssue {
  message: string;
  severity: 'error' | 'warning' | 'info';
  location?: { line: number; column: number };
}

export interface ProviderValidationResult {
  provider: string;
  ruleSetId: string;
  displayName: string;
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
}

export interface ValidateSchemaResponse {
  results: ProviderValidationResult[];
  summary: string;
}

export interface FixResult {
  fixedSchema: string;
  appliedFixes: string[];
  remainingIssues: string[];
}

export type { ProviderId } from '@ssv/schemas/types';
