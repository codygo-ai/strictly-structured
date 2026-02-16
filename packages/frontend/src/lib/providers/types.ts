export type ProviderId = 'openai' | 'google' | 'anthropic';

export interface ValidationResult {
  provider: ProviderId;
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

export const PROVIDER_IDS: ProviderId[] = ['openai', 'google', 'anthropic'];
