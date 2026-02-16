import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fixSchemaForRuleSet } from '@ssv/schemas/ruleSetFixer';
import { z } from 'zod';

import { getRuleSetByProvider } from '../lib/ruleSets';
import type { ProviderId } from '../lib/types';

export function registerFixSchemaTool(server: McpServer): void {
  server.tool(
    'fix_schema',
    'Apply mechanical, rule-based fixes to a JSON schema to make it compatible with a specific LLM provider. No LLM API calls needed.',
    {
      schema: z.string().describe('The JSON schema to fix, as a JSON string'),
      provider: z
        .enum(['openai', 'anthropic', 'gemini'])
        .describe('The target provider to fix the schema for'),
    },
    async ({ schema, provider }) => {
      const ruleSet = getRuleSetByProvider(provider as ProviderId);
      if (!ruleSet) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ error: `Unknown provider: ${provider}` }),
            },
          ],
          isError: true,
        };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(schema);
      } catch {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Invalid JSON',
                fixedSchema: schema,
                appliedFixes: [],
                remainingIssues: ['Invalid JSON'],
              }),
            },
          ],
          isError: true,
        };
      }

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Schema must be a JSON object',
                fixedSchema: schema,
                appliedFixes: [],
                remainingIssues: ['Schema must be a JSON object'],
              }),
            },
          ],
          isError: true,
        };
      }

      const result = fixSchemaForRuleSet(parsed as Record<string, unknown>, ruleSet);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                fixedSchema: JSON.stringify(result.fixedSchema, undefined, 2),
                appliedFixes: result.appliedFixes.map((f) => f.description),
                remainingIssues: result.unresolvedErrors.map((e) => e.message),
              },
              undefined,
              2,
            ),
          },
        ],
      };
    },
  );
}
