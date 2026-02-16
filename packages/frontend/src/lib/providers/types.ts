export interface ValidationResult {
  provider: string;
  model: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface ServerValidationState {
  loading: boolean;
  results?: ValidationResult[];
  error?: string;
}
