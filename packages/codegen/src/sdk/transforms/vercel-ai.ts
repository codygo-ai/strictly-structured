import type { SdkChange, SdkGap, SdkTransformResult } from '../../types';
import { addChange, deepClone, isObjectNode, walkAllObjects } from '../shared';

/**
 * Simulates Vercel AI SDK transforms.
 *
 * Behavior varies by target provider:
 * - OpenAI (strictJsonSchema: true): additionalProperties: false + all-required
 * - Gemini: Converts JSON Schema → OpenAPI 3.0 subset
 * - Anthropic: Pass-through (no transforms!)
 *
 * Since we don't know the target provider at simulation time, we simulate the
 * OpenAI strict path (most common use case) and note the gaps for other providers.
 */
export function simulateVercelAi(schema: Record<string, unknown>): SdkTransformResult {
  const original = deepClone(schema);
  const transformed = deepClone(schema);
  const changes: SdkChange[] = [];
  const gaps: SdkGap[] = [];

  // Vercel AI SDK's OpenAI path: additionalProperties: false + all-required
  walkAllObjects(transformed, '', (node, path) => {
    if (!isObjectNode(node)) return;

    // Force additionalProperties: false
    if (node['additionalProperties'] !== false) {
      const before = node['additionalProperties'];
      node['additionalProperties'] = false;
      addChange(
        changes,
        `${path}/additionalProperties`,
        before === undefined ? 'added' : 'modified',
        `Set additionalProperties to false (OpenAI strict path)`,
        before,
        false,
      );
    }

    // Force all properties into required
    if (node['properties'] && typeof node['properties'] === 'object') {
      const props = node['properties'] as Record<string, unknown>;
      const propKeys = Object.keys(props);
      const existing = Array.isArray(node['required']) ? (node['required'] as string[]) : [];
      const missing = propKeys.filter((k) => !existing.includes(k));

      if (missing.length > 0) {
        node['required'] = propKeys;
        addChange(
          changes,
          `${path}/required`,
          existing.length > 0 ? 'modified' : 'added',
          `Added all properties to required: ${missing.join(', ')}`,
          existing,
          propKeys,
        );
      }
    }
  });

  // Gaps
  gaps.push({
    rule: 'anthropic_no_transforms',
    description:
      "Vercel AI SDK does NOT apply Anthropic's transform_schema(). When targeting Anthropic, unsupported keywords (pattern, format, minLength, etc.) are passed through as-is.",
    willCauseError: true,
  });

  const rootType = transformed['type'];
  if (rootType !== 'object') {
    gaps.push({
      rule: 'root_type',
      description:
        'Vercel AI SDK does not validate root type. Non-object roots will fail for OpenAI and Anthropic.',
      willCauseError: true,
    });
  }

  // Check for unsupported keywords
  const passedThrough = [
    'pattern',
    'format',
    'minLength',
    'maxLength',
    'minimum',
    'maximum',
    'multipleOf',
    'minItems',
    'maxItems',
    'uniqueItems',
  ];
  const found = new Set<string>();
  walkAllObjects(transformed, '', (node) => {
    for (const kw of passedThrough) {
      if (kw in node) found.add(kw);
    }
  });
  for (const kw of found) {
    gaps.push({
      rule: `passed_through_${kw}`,
      description: `Vercel AI SDK passes "${kw}" through for all providers. This may cause errors for OpenAI strict mode.`,
      willCauseError: true,
    });
  }

  return { sdk: 'vercel-ai', original, transformed, changes, gaps };
}
