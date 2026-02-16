import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { zodToJsonSchema, simulateSdkTransform, detectFormat, SDK_IDS } from '@ssv/codegen';
import type { SdkId } from '@ssv/codegen';
import { validateSchemaForRuleSet } from '@ssv/schemas/ruleSetValidator';
import { z } from 'zod';

import { getRuleSetsByProviders } from '../lib/ruleSets';
import type { ProviderId, ProviderValidationResult } from '../lib/types';

const DEFAULT_SDK_FOR_PROVIDER: Record<string, SdkId> = {
  openai: 'openai-sdk',
  anthropic: 'anthropic-sdk',
  gemini: 'gemini-sdk',
};

export function registerValidateCodeTool(server: McpServer): void {
  server.tool(
    'validate_code',
    'Convert Zod/Pydantic code → simulate SDK/framework transform → validate against provider rules. Shows the full pipeline: raw schema, SDK-transformed schema, validation results, and SDK gaps.',
    {
      code: z.string().describe('Zod or Pydantic code to validate'),
      format: z
        .enum(['zod', 'pydantic'])
        .optional()
        .describe('Code format. Auto-detected if omitted.'),
      sdk: z
        .enum(SDK_IDS)
        .optional()
        .describe('SDK/framework to simulate. Defaults to the official SDK for each provider.'),
      providers: z
        .array(z.enum(['openai', 'anthropic', 'gemini']))
        .optional()
        .describe('Providers to validate against. Defaults to all.'),
    },
    async ({ code, format, sdk, providers }) => {
      try {
        const detectedFormat = format ?? detectFormat(code);

        if (detectedFormat === 'json-schema') {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    error:
                      'Input looks like JSON Schema. Use validate_schema instead, which accepts raw JSON Schema directly.',
                  },
                  undefined,
                  2,
                ),
              },
            ],
            isError: true,
          };
        }

        if (detectedFormat === 'pydantic') {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    error:
                      'Pydantic code validation requires Python runtime. Paste the output of YourModel.model_json_schema() as JSON Schema and use validate_schema instead.',
                  },
                  undefined,
                  2,
                ),
              },
            ],
            isError: true,
          };
        }

        const conversion = zodToJsonSchema(code);
        const rawSchema = conversion.schema;

        const ruleSets = getRuleSetsByProviders(providers as ProviderId[] | undefined);

        const providerResults = ruleSets.map((ruleSet) => {
          const targetSdk = sdk ?? DEFAULT_SDK_FOR_PROVIDER[ruleSet.providerId] ?? 'openai-sdk';

          const sdkResult = simulateSdkTransform(rawSchema, targetSdk);
          const transformedSchemaStr = JSON.stringify(sdkResult.transformed, undefined, 2);

          const markers = validateSchemaForRuleSet(transformedSchemaStr, ruleSet);
          const errors = markers.filter((m) => m.severity === 'error');
          const warnings = markers.filter((m) => m.severity === 'warning');
          const infos = markers.filter((m) => m.severity === 'info');

          const validation: ProviderValidationResult = {
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
          };

          return {
            provider: ruleSet.providerId,
            sdk: targetSdk,
            sdkTransform: {
              changes: sdkResult.changes,
              gaps: sdkResult.gaps,
              transformedSchema: sdkResult.transformed,
            },
            validation,
          };
        });

        const validProviders = providerResults
          .filter((r) => r.validation.valid)
          .map((r) => r.provider);
        const invalidProviders = providerResults
          .filter((r) => !r.validation.valid)
          .map((r) => r.provider);
        const totalGaps = providerResults.reduce((sum, r) => sum + r.sdkTransform.gaps.length, 0);

        const summary = [
          validProviders.length === providerResults.length
            ? `Valid for all ${providerResults.length} providers.`
            : invalidProviders.length === providerResults.length
              ? `Invalid for all ${providerResults.length} providers.`
              : `Valid for ${validProviders.length}/${providerResults.length} providers (${validProviders.join(', ')}). Issues for: ${invalidProviders.join(', ')}.`,
          totalGaps > 0
            ? `${totalGaps} SDK gap(s) detected — issues your SDK does NOT fix.`
            : 'No SDK gaps detected.',
        ].join(' ');

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  conversion: {
                    rawSchema,
                    warnings: conversion.warnings,
                  },
                  results: providerResults,
                  summary,
                },
                undefined,
                2,
              ),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            { type: 'text' as const, text: JSON.stringify({ error: message }, undefined, 2) },
          ],
          isError: true,
        };
      }
    },
  );
}
