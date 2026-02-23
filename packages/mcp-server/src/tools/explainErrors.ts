import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { validateSchemaForRuleSet } from '@ssv/schemas/ruleSetValidator';
import { z } from 'zod';

import { getRuleSetsByProviders, type SchemaRuleSet } from '../lib/ruleSets';
import type { ProviderId, ValidationIssue } from '../lib/types';

interface ExplainResult {
  provider: string;
  ruleSetId: string;
  displayName: string;
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
  explanations?: Array<{ message: string; why: string; suggestedFix: string }>;
}

function explainError(message: string): { why: string; suggestedFix: string } {
  if (message.includes('additionalProperties') && message.includes('false')) {
    return {
      why: 'Structured output APIs need a strict shape so the model cannot add extra keys.',
      suggestedFix: 'Add "additionalProperties": false to every object in the schema.',
    };
  }
  if (message.includes('required') && message.includes('properties')) {
    return {
      why: 'The provider requires every declared property to be in "required" so the output shape is unambiguous.',
      suggestedFix: 'Add a "required" array listing all property names from "properties".',
    };
  }
  if (message.includes('Unsupported keyword') || message.includes('unsupported')) {
    return {
      why: 'The provider does not support this JSON Schema keyword for structured output.',
      suggestedFix: 'Remove the keyword or move the constraint into the "description" field.',
    };
  }
  if (message.includes('Root type') || message.includes('root')) {
    return {
      why: 'The provider only allows certain root types (usually object).',
      suggestedFix:
        'Use "type": "object" at root, or wrap the schema in an object with a single property.',
    };
  }
  if (message.includes('anyOf') || message.includes('allOf') || message.includes('oneOf')) {
    return {
      why: 'Composition keywords are not supported (or only anyOf at root in some providers).',
      suggestedFix:
        'Restructure the schema without allOf/oneOf/not, or use a single anyOf at root if allowed.',
    };
  }
  return {
    why: 'The provider enforces this rule for reliable structured output.',
    suggestedFix: 'Adjust the schema to satisfy the rule; see provider docs for details.',
  };
}

export function registerExplainErrorsTool(server: McpServer): void {
  server.tool(
    'explain_errors',
    'Validate a JSON schema against provider rules and return human-readable explanations for each error (what it means, why the provider requires it, and how to fix it). Use when the user wants to understand validation failures.',
    {
      schema: z.string().describe('The JSON schema to validate, as a JSON string'),
      providers: z
        .array(z.enum(['openai', 'anthropic', 'gemini']))
        .optional()
        .describe('Provider rule sets to validate against. Defaults to all if omitted.'),
    },
    async ({ schema, providers }) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(schema);
      } catch {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  error: 'Invalid JSON',
                  explanations: [],
                  summary: 'Input is not valid JSON. Fix JSON syntax before validating.',
                },
                undefined,
                2,
              ),
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
              text: JSON.stringify(
                {
                  error: 'Schema must be a JSON object',
                  explanations: [],
                  summary: 'Schema must be a JSON object.',
                },
                undefined,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      const ruleSets = getRuleSetsByProviders(providers as ProviderId[] | undefined);
      const results: ExplainResult[] = ruleSets.map((ruleSet: SchemaRuleSet) => {
        const markers = validateSchemaForRuleSet(schema, ruleSet);
        const errors = markers.filter((m) => m.severity === 'error');
        const warnings = markers.filter((m) => m.severity === 'warning');
        const infos = markers.filter((m) => m.severity === 'info');

        const explanations = errors.map((e) => {
          const { why, suggestedFix } = explainError(e.message);
          return { message: e.message, why, suggestedFix };
        });

        return {
          provider: ruleSet.providerId,
          ruleSetId: ruleSet.ruleSetId,
          displayName: ruleSet.displayName,
          valid: errors.length === 0,
          errors: errors.map((m) => ({
            message: m.message,
            severity: m.severity,
            location: { line: m.startLineNumber, column: m.startColumn },
          })),
          warnings: warnings.map((m) => ({
            message: m.message,
            severity: m.severity,
            location: { line: m.startLineNumber, column: m.startColumn },
          })),
          infos: infos.map((m) => ({
            message: m.message,
            severity: m.severity,
            location: { line: m.startLineNumber, column: m.startColumn },
          })),
          ...(explanations.length ? { explanations } : {}),
        };
      });

      const validCount = results.filter((r) => r.valid).length;
      const summary =
        validCount === results.length
          ? `Valid for all ${results.length} providers; no errors to explain.`
          : `Explanations for ${results.filter((r) => !r.valid).length} provider(s) with errors.`;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ results, summary }, undefined, 2),
          },
        ],
      };
    },
  );
}
