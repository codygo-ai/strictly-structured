import { OpenAIIcon, ClaudeIcon, GeminiIcon } from "~/components/icons";
import type { ProviderId } from "~/types/schemaRuleSets";

interface ProviderIconProps {
  provider: ProviderId;
  size?: number;
  className?: string;
}

export function ProviderIcon({
  provider,
  size = 16,
  className = "shrink-0",
}: ProviderIconProps) {
  switch (provider) {
    case "openai":
      return <OpenAIIcon className={className} width={size} height={size} />;
    case "anthropic":
      return <ClaudeIcon className={className} width={size} height={size} />;
    case "gemini":
      return <GeminiIcon className={className} width={size} height={size} />;
    default:
      return null;
  }
}
