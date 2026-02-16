/**
 * Map ruleSetId → cheapest model id for server validation.
 * Must match config in compatibility-runner.
 */
export const RULESET_TO_CHEAPEST_MODEL_ID: Record<string, string> = {
  "gpt-4-o1": "openai:gpt-4.1-mini",
  "gemini-2-5": "google:gemini-2.5-flash",
  "claude-4-5": "anthropic:claude-haiku-4-5",
};
