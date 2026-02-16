import type { ProviderId } from '@ssv/schemas/types';

import { OpenAIIcon, ClaudeIcon, GeminiIcon } from '~/components/icons';

const PROVIDER_COLORS: Record<ProviderId, string> = {
  openai: 'var(--ds-primary)',
  anthropic: 'var(--ds-provider-anthropic)',
  gemini: 'var(--ds-provider-gemini)',
};

interface ProviderIconProps {
  provider: ProviderId;
  size?: number;
  className?: string;
  /** Apply brand color. Set true to use provider color, false to inherit parent color. */
  colored?: boolean;
}

export function ProviderIcon({
  provider,
  size = 16,
  className = 'shrink-0',
  colored = false,
}: ProviderIconProps) {
  const style = colored ? { color: PROVIDER_COLORS[provider] } : undefined;

  switch (provider) {
    case 'openai':
      return <OpenAIIcon className={className} width={size} height={size} style={style} />;
    case 'anthropic':
      return <ClaudeIcon className={className} width={size} height={size} style={style} />;
    case 'gemini':
      return <GeminiIcon className={className} width={size} height={size} style={style} />;
    default:
      return null;
  }
}
