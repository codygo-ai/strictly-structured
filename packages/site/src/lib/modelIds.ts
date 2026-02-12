import type { ProviderId } from "~/lib/providers/types";

/**
 * Map provider (UI selection) to compatibility-data model id.
 * Must match config in compatibility-runner.
 */
export const PROVIDER_TO_MODEL_ID: Record<ProviderId, string> = {
  openai: "openai:gpt-4o-mini",
  google: "google:gemini-2.0-flash",
  anthropic: "anthropic:claude-3-5-haiku",
};
