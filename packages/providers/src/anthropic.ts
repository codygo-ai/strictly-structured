import Anthropic from '@anthropic-ai/sdk';

import type { ProviderResult } from './types';

const PROMPT =
  'Return a valid JSON object that matches the given schema. Use minimal placeholder data.';

export async function validateWithAnthropic(
  schema: object,
  apiKey: string,
  model: string,
): Promise<ProviderResult> {
  const start = Date.now();
  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 256,
      messages: [{ role: 'user', content: PROMPT }],
      tools: [
        {
          name: 'output',
          description: 'Return the JSON output',
          input_schema: {
            ...(schema as Record<string, unknown>),
            type: 'object' as const,
          } satisfies { type: 'object'; [key: string]: unknown },
        },
      ],
      tool_choice: { type: 'tool', name: 'output' },
    });

    const toolUse = message.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');

    if (!toolUse || toolUse.name !== 'output') {
      return {
        provider: 'anthropic',
        model,
        ok: false,
        latencyMs: Date.now() - start,
        error: 'Model did not return tool use',
      };
    }

    return { provider: 'anthropic', model, ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return {
      provider: 'anthropic',
      model,
      ok: false,
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
