import type { SdkChange, SdkGap, SdkTransformResult } from '../../types';
import { deepClone, isObjectNode, walkAllObjects } from '../shared';

/**
 * Simulates Instructor (Python) transforms.
 *
 * Instructor uses its own `openai_schema()`, NOT OpenAI SDK's `to_strict_json_schema`.
 * No strict-mode transforms applied — relies on retry/reask instead.
 * Schema is sent essentially as-is from Pydantic's model_json_schema().
 */
export function simulateInstructor(schema: Record<string, unknown>): SdkTransformResult {
  const original = deepClone(schema);
  const transformed = deepClone(schema);
  const changes: SdkChange[] = [];
  const gaps: SdkGap[] = [];

  // Instructor applies essentially no transforms to the schema itself.
  // It uses retry/reask to handle validation failures.

  // Gap: no additionalProperties: false
  let missingAP = false;
  walkAllObjects(transformed, '', (node) => {
    if (isObjectNode(node) && node['additionalProperties'] !== false) {
      missingAP = true;
    }
  });
  if (missingAP) {
    gaps.push({
      rule: 'no_additionalProperties',
      description:
        'Instructor does not add additionalProperties: false. Schema is sent as-is. OpenAI strict mode and Anthropic require this.',
      willCauseError: true,
    });
  }

  // Gap: no all-required
  let hasOptional = false;
  walkAllObjects(transformed, '', (node) => {
    if (node['properties'] && typeof node['properties'] === 'object') {
      const propKeys = Object.keys(node['properties'] as Record<string, unknown>);
      const required = Array.isArray(node['required']) ? (node['required'] as string[]) : [];
      if (propKeys.some((k) => !required.includes(k))) {
        hasOptional = true;
      }
    }
  });
  if (hasOptional) {
    gaps.push({
      rule: 'all_fields_required',
      description:
        "Instructor does not force all properties into 'required'. Relies on retry/reask instead.",
      willCauseError: true,
    });
  }

  // Gap: no keyword stripping
  const unsupportedKeywords = [
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
    for (const kw of unsupportedKeywords) {
      if (kw in node) found.add(kw);
    }
  });
  for (const kw of found) {
    gaps.push({
      rule: `passed_through_${kw}`,
      description: `Instructor passes "${kw}" through. Relies on retry/reask for any resulting errors.`,
      willCauseError: false,
    });
  }

  // Gap: uses own openai_schema(), not to_strict_json_schema
  gaps.push({
    rule: 'no_strict_transforms',
    description:
      "Instructor uses its own openai_schema(), NOT OpenAI's to_strict_json_schema(). No strict-mode transforms are applied. It relies entirely on retry/reask to handle API errors.",
    willCauseError: false,
  });

  return { sdk: 'instructor', original, transformed, changes, gaps };
}
