import { OpenAIIcon, ClaudeIcon, GeminiIcon } from "~/components/icons";
import type { ProviderId } from "~/types/schemaRuleSets";

const PROVIDER_COLORS: Record<ProviderId, string> = {
  openai: "var(--ds-primary)",
  anthropic: "var(--ds-provider-anthropic)",
  gemini: "var(--ds-provider-gemini)",
};

interface ProviderIconProps {
  provider: ProviderId;
  size?: number;
  className?: string;
  /** Apply brand color (default true). Set false to inherit parent color. */
  colored?: boolean;
}

export function ProviderIcon({
  provider,
  size = 16,
  className = "shrink-0",
  colored = true,
}: ProviderIconProps) {
  const style = colored ? { color: PROVIDER_COLORS[provider] } : undefined;

  switch (provider) {
    case "openai":
      return <OpenAIIcon className={className} width={size} height={size} style={style} />;
    case "anthropic":
      return <ClaudeIcon className={className} width={size} height={size} style={style} />;
    case "gemini":
      return <GeminiIcon className={className} width={size} height={size} style={style} />;
    default:
      return null;
  }
}
