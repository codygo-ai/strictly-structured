export type ProviderId = 'openai' | 'anthropic' | 'google';

export interface ProviderResult {
  provider: ProviderId;
  model: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}
