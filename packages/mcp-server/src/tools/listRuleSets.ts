import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { getRuleSetsByProviders, getRuleSetsMeta } from '../lib/ruleSets';
import type { ProviderId } from '../lib/types';

export function registerListRuleSetsTool(server: McpServer): void {
  server.tool(
    'list_rule_sets',
    'List available LLM provider rule sets and their models for structured output schema validation.',
    {
      provider: z
        .enum(['openai', 'anthropic', 'gemini'])
        .optional()
        .describe('Filter to a specific provider. Returns all if omitted.'),
    },
    async ({ provider }) => {
      const providers = provider ? [provider as ProviderId] : undefined;
      const ruleSets = getRuleSetsByProviders(providers);
      const meta = getRuleSetsMeta();

      const result = {
        ruleSets: ruleSets.map((r) => ({
          ruleSetId: r.ruleSetId,
          displayName: r.displayName,
          provider: r.provider,
          providerId: r.providerId,
          models: r.models,
          description: r.description,
          docUrl: r.docUrl,
        })),
        meta: {
          version: meta.version,
          lastUpdated: meta.lastUpdated,
        },
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, undefined, 2) }],
      };
    },
  );
}
