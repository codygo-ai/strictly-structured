export type ProviderId = 'openai' | 'google' | 'anthropic';

export interface ValidationResult {
  provider: ProviderId;
  model: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}
