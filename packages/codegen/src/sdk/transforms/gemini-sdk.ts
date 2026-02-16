import type { SdkChange, SdkGap, SdkTransformResult } from '../../types';
import { addChange, deepClone, isObjectNode, resolveRefs, walkAllObjects } from '../shared';

/**
 * Simulates Google GenAI SDK transforms.
 *
 * Transforms applied:
 * 1. Inline all `$ref`/`$defs` (flatten)
 * 2. Convert `null` type to `nullable: true` property
 * 3. Convert `const` → single-value `enum`
 * 4. Inject `propertyOrdering` from property key order
 */
export function simulateGeminiSdk(schema: Record<string, unknown>): SdkTransformResult {
  const original = deepClone(schema);
  let transformed = deepClone(schema);
  const changes: SdkChange[] = [];
  const gaps: SdkGap[] = [];

  // 1. Inline $ref/$defs
  const hadDefs = transformed['$defs'] !== undefined || transformed['definitions'] !== undefined;
  transformed = resolveRefs(transformed);
  if (hadDefs) {
    addChange(changes, '/$defs', 'removed', 'Inlined all $ref/$defs references');
  }

  // 2-4. Walk all nodes
  walkAllObjects(transformed, '', (node, path) => {
    // Convert null type → nullable
    const rawType = node['type'];
    if (Array.isArray(rawType)) {
      const nonNull = rawType.filter((t) => t !== 'null');
      const hasNull = rawType.includes('null');
      if (hasNull && nonNull.length === 1) {
        node['type'] = nonNull[0];
        node['nullable'] = true;
        addChange(
          changes,
          `${path}/type`,
          'modified',
          `Converted type [${rawType.join(', ')}] to type "${nonNull[0]}" + nullable: true`,
          rawType,
          nonNull[0],
        );
      }
    }
    if (node['type'] === 'null') {
      node['type'] = 'string';
      node['nullable'] = true;
      addChange(
        changes,
        `${path}/type`,
        'modified',
        `Converted type "null" to type "string" + nullable: true`,
        'null',
        'string',
      );
    }

    // Convert const → single-value enum
    if ('const' in node) {
      const constValue = node['const'];
      node['enum'] = [constValue];
      delete node['const'];
      addChange(
        changes,
        `${path}/const`,
        'modified',
        `Converted const to single-value enum`,
        constValue,
        [constValue],
      );
    }

    // Inject propertyOrdering
    if (isObjectNode(node) && node['properties'] && typeof node['properties'] === 'object') {
      const propKeys = Object.keys(node['properties'] as Record<string, unknown>);
      if (propKeys.length > 0 && !node['propertyOrdering']) {
        node['propertyOrdering'] = propKeys;
        addChange(
          changes,
          `${path}/propertyOrdering`,
          'added',
          `Injected propertyOrdering from property key order`,
          undefined,
          propKeys,
        );
      }
    }
  });

  // Gaps
  const unsupportedKeywords = [
    'pattern',
    'minLength',
    'maxLength',
    'minItems',
    'maxItems',
    'uniqueItems',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'multipleOf',
    'prefixItems',
    'additionalProperties',
  ];
  const found = new Set<string>();
  walkAllObjects(transformed, '', (node) => {
    for (const kw of unsupportedKeywords) {
      if (kw in node) found.add(kw);
    }
  });
  for (const kw of found) {
    gaps.push({
      rule: `unsupported_keyword_${kw}`,
      description: `Gemini SDK does not strip "${kw}". This keyword may be silently ignored by Gemini.`,
      willCauseError: false,
    });
  }

  return { sdk: 'gemini-sdk', original, transformed, changes, gaps };
}
