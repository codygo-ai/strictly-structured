import type { SdkChange, SdkGap, SdkTransformResult } from '../../types';
import { addChange, deepClone, isObjectNode, resolveRefs, walkAllObjects } from '../shared';

/**
 * Simulates LangChain Python transforms.
 *
 * Transforms applied:
 * 1. Dereferences $ref
 * 2. For OpenAI strict=True: adds additionalProperties: false at TOP-LEVEL ONLY
 *
 * Known bug: does NOT add additionalProperties: false to nested objects (issue #28106).
 * Does NOT call Anthropic's transform_schema().
 */
export function simulateLangchainPy(schema: Record<string, unknown>): SdkTransformResult {
  const original = deepClone(schema);
  let transformed = deepClone(schema);
  const changes: SdkChange[] = [];
  const gaps: SdkGap[] = [];

  // 1. Dereference $ref
  const hadRefs = transformed['$defs'] !== undefined || transformed['definitions'] !== undefined;
  transformed = resolveRefs(transformed);
  if (hadRefs) {
    addChange(changes, '/$defs', 'removed', 'Dereferenced all $ref references');
  }

  // 2. Top-level only: additionalProperties: false (known limitation)
  if (isObjectNode(transformed) && transformed['additionalProperties'] !== false) {
    const before = transformed['additionalProperties'];
    transformed['additionalProperties'] = false;
    addChange(
      changes,
      '/additionalProperties',
      before === undefined ? 'added' : 'modified',
      `Set additionalProperties to false at root only (LangChain limitation)`,
      before,
      false,
    );
  }

  // Gap: nested objects missing additionalProperties: false
  let hasNestedObjectsWithoutAP = false;
  walkAllObjects(transformed, '', (node, path) => {
    if (path === '') return; // Skip root, already handled
    if (isObjectNode(node) && node['additionalProperties'] !== false) {
      hasNestedObjectsWithoutAP = true;
    }
  });

  if (hasNestedObjectsWithoutAP) {
    gaps.push({
      rule: 'nested_additionalProperties',
      description:
        'LangChain Python only adds additionalProperties: false at the top level. Nested objects are missing it (known issue #28106). This will cause OpenAI strict mode to reject the schema.',
      willCauseError: true,
    });
  }

  // Gap: no Anthropic transform
  gaps.push({
    rule: 'anthropic_no_transform',
    description:
      "LangChain Python does NOT call Anthropic's transform_schema(). Unsupported keywords are passed through.",
    willCauseError: true,
  });

  // Gap: unsupported keywords passed through
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
      description: `LangChain Python passes "${kw}" through without modification. This may cause API errors.`,
      willCauseError: true,
    });
  }

  // Gap: all-required not enforced
  let hasOptionalFields = false;
  walkAllObjects(transformed, '', (node) => {
    if (node['properties'] && typeof node['properties'] === 'object') {
      const propKeys = Object.keys(node['properties'] as Record<string, unknown>);
      const required = Array.isArray(node['required']) ? (node['required'] as string[]) : [];
      if (propKeys.some((k) => !required.includes(k))) {
        hasOptionalFields = true;
      }
    }
  });
  if (hasOptionalFields) {
    gaps.push({
      rule: 'all_fields_required',
      description:
        "LangChain Python does not add all properties to 'required'. Optional fields will cause errors for OpenAI strict mode and Anthropic.",
      willCauseError: true,
    });
  }

  return { sdk: 'langchain-py', original, transformed, changes, gaps };
}
