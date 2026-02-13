import type { ProviderId } from "./types.js";

/**
 * Map compatibility-runner model id → (provider, API model name).
 * Must stay in sync with devops/compatibility-runner/config/models.json.
 */
export const MODEL_MAP: Record<
  string,
  { provider: ProviderId; model: string }
> = {
  "openai:gpt-4.1-mini": { provider: "openai", model: "gpt-4.1-mini" },
  "openai:gpt-5-mini": { provider: "openai", model: "gpt-5-mini" },
  "openai:gpt-5-nano": { provider: "openai", model: "gpt-5-nano" },
  "openai:gpt-5.2": { provider: "openai", model: "gpt-5.2" },
  "openai:gpt-5.1": { provider: "openai", model: "gpt-5.1" },
  "openai:gpt-5": { provider: "openai", model: "gpt-5" },
  "openai:gpt-5.2-pro": { provider: "openai", model: "gpt-5.2-pro" },
  "openai:gpt-5-pro": { provider: "openai", model: "gpt-5-pro" },
  "openai:gpt-4.1": { provider: "openai", model: "gpt-4.1" },
  "google:gemini-3-pro-preview": {
    provider: "google",
    model: "gemini-3-pro-preview",
  },
  "google:gemini-3-flash-preview": {
    provider: "google",
    model: "gemini-3-flash-preview",
  },
  "google:gemini-2.5-flash": { provider: "google", model: "gemini-2.5-flash" },
  "google:gemini-2.5-flash-lite": {
    provider: "google",
    model: "gemini-2.5-flash-lite",
  },
  "google:gemini-2.5-pro": { provider: "google", model: "gemini-2.5-pro" },
  "anthropic:claude-haiku-4-5": {
    provider: "anthropic",
    model: "claude-haiku-4-5",
  },
  "anthropic:claude-sonnet-4-5": {
    provider: "anthropic",
    model: "claude-sonnet-4-5",
  },
  "anthropic:claude-opus-4-6": {
    provider: "anthropic",
    model: "claude-opus-4-6",
  },
  "anthropic:claude-3-5-haiku": {
    provider: "anthropic",
    model: "claude-3-5-haiku-20241022",
  },
};
