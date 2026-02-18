import type { AppliedFix, UnresolvedError } from '@ssv/schemas/ruleSetFixer';
import type { SchemaMarker } from '@ssv/schemas/ruleSetValidator';
import type { RuleSetId } from '@ssv/schemas/types';

export interface ValidationOutcome {
  valid: boolean;
  errors: SchemaMarker[];
  warnings: SchemaMarker[];
}

export interface LlmTestOutcome {
  model: string;
  valid: boolean;
  error?: string;
  latencyMs: number;
}

export interface FixOutcome {
  appliedFixes: AppliedFix[];
  unresolvedErrors: UnresolvedError[];
  postFixValidation: ValidationOutcome;
  postFixLlmTest: LlmTestOutcome;
  fixedSchema: Record<string, unknown>;
}

export interface RuleSetReport {
  ruleSetId: RuleSetId;
  validation: ValidationOutcome;
  llmTest: LlmTestOutcome;
  fix?: FixOutcome;
}

export interface DocumentReport {
  path: string;
  structural: { valid: boolean; errors: string[] };
  ruleSetResults: RuleSetReport[];
}

export interface ReportSummary {
  totalDocuments: number;
  totalTests: number;
  passedBoth: number;
  failedValidationOnly: number;
  failedLlmOnly: number;
  failedBoth: number;
  fixAttempted: number;
  fixSucceeded: number;
}

export interface VerifyReport {
  meta: { timestamp: string; documentsCount: number; ruleSetIds: RuleSetId[] };
  documents: DocumentReport[];
  summary: ReportSummary;
}

export interface VerifyOptions {
  ruleSetIds?: RuleSetId[];
  outputPath?: string;
  skipLlm?: boolean;
  skipFix?: boolean;
}
