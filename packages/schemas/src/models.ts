import type { RuleSetId } from './types';

/**
 * Map ruleSetId to cheapest model id for server validation.
 * Must stay in sync with devops/compatibility-runner/config/models.json.
 */
export const RULESET_TO_CHEAPEST_MODEL: Record<RuleSetId, string> = {
  'gpt-4-o1': 'openai:gpt-4.1-mini',
  'gemini-2-5': 'google:gemini-2.5-flash',
  'claude-4-5': 'anthropic:claude-haiku-4-5',
};
