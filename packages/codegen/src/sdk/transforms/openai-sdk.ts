import type { SdkChange, SdkGap, SdkTransformResult } from '../../types';
import { addChange, deepClone, isObjectNode, resolveRefs, walkAllObjects } from '../shared';

/**
 * Simulates OpenAI SDK's `zodResponseFormat()` / `to_strict_json_schema()`.
 *
 * Transforms applied:
 * 1. Force `additionalProperties: false` on all objects (recursive)
 * 2. Force all property keys into `required` array (recursive)
 * 3. Make previously-optional fields nullable (type: [T, "null"])
 * 4. Unwrap single-entry `allOf` to the inner schema
 * 5. Dereference `$ref` nodes that have sibling keywords
 * 6. Strip undefined/null defaults
 */
export function simulateOpenAiSdk(schema: Record<string, unknown>): SdkTransformResult {
  const original = deepClone(schema);
  const transformed = deepClone(schema);
  const changes: SdkChange[] = [];
  const gaps: SdkGap[] = [];

  // 1. Dereference $refs with siblings (pass root defs for resolution)
  const rootDefs = (transformed['$defs'] ?? transformed['definitions'] ?? {}) as Record<
    string,
    unknown
  >;
  dereferenceRefsWithSiblings(transformed, '', changes, rootDefs);

  // 2. Unwrap single-entry allOf
  unwrapSingleAllOf(transformed, '', changes);

  // 3-5. Walk all objects for additionalProperties, required, nullable
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
        `Set additionalProperties to false`,
        before,
        false,
      );
    }

    // Force all properties into required + make optional ones nullable
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

        // Make previously-optional fields nullable
        for (const key of missing) {
          const prop = props[key] as Record<string, unknown> | undefined;
          if (prop && typeof prop === 'object' && prop['type'] !== undefined) {
            const originalType = prop['type'];

            if (typeof originalType === 'string' && originalType !== 'null') {
              const newType = [originalType, 'null'];
              prop['type'] = newType;
              addChange(
                changes,
                `${path}/properties/${key}/type`,
                'modified',
                `Made "${key}" nullable (was optional, now required)`,
                originalType,
                newType,
              );
            } else if (Array.isArray(originalType) && !originalType.includes('null')) {
              const newType = [...originalType, 'null'];
              prop['type'] = newType;
              addChange(
                changes,
                `${path}/properties/${key}/type`,
                'modified',
                `Made "${key}" nullable (was optional, now required)`,
                originalType,
                newType,
              );
            }
          }
        }
      }
    }
  });

  // 6. Strip undefined/null defaults
  walkAllObjects(transformed, '', (node, path) => {
    if ('default' in node && (node['default'] === undefined || node['default'] === null)) {
      const before = node['default'];
      delete node['default'];
      addChange(
        changes,
        `${path}/default`,
        'removed',
        `Removed null/undefined default`,
        before,
        undefined,
      );
    }
  });

  // Identify gaps — things OpenAI SDK does NOT fix
  const rootType = transformed['type'];
  if (rootType !== 'object' && !Array.isArray(transformed['anyOf'])) {
    gaps.push({
      rule: 'root_type',
      description:
        "OpenAI SDK does not validate that root type is 'object'. Non-object root schemas may cause API errors.",
      willCauseError: true,
    });
  }

  // Check for unsupported keywords that the SDK doesn't strip
  const unsupportedKeywords = [
    'minLength',
    'maxLength',
    'minimum',
    'maximum',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'multipleOf',
    'pattern',
    'minItems',
    'maxItems',
    'uniqueItems',
    'format',
  ];
  checkForUnsupportedKeywords(transformed, unsupportedKeywords, gaps);

  return { sdk: 'openai-sdk', original, transformed, changes, gaps };
}

function dereferenceRefsWithSiblings(
  node: Record<string, unknown>,
  path: string,
  changes: SdkChange[],
  rootDefs: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === 'object') {
          dereferenceRefsWithSiblings(
            item as Record<string, unknown>,
            `${path}/${key}/${i}`,
            changes,
            rootDefs,
          );
        }
      });
    } else if (value && typeof value === 'object') {
      const subNode = value as Record<string, unknown>;
      if (typeof subNode['$ref'] === 'string') {
        const nonRefKeys = Object.keys(subNode).filter((k) => k !== '$ref');
        if (nonRefKeys.length > 0) {
          // Has siblings — dereference using root $defs
          const resolved = resolveRefs({ ...subNode, $defs: rootDefs });
          delete resolved['$defs'];
          node[key] = resolved;
          addChange(
            changes,
            `${path}/${key}`,
            'modified',
            `Dereferenced $ref with sibling keys: ${nonRefKeys.join(', ')}`,
            subNode,
            resolved,
          );
        }
      }
      // Recurse on the (potentially updated) node
      const current = node[key];
      if (current && typeof current === 'object') {
        dereferenceRefsWithSiblings(
          current as Record<string, unknown>,
          `${path}/${key}`,
          changes,
          rootDefs,
        );
      }
    }
  }
}

function unwrapSingleAllOf(
  node: Record<string, unknown>,
  path: string,
  changes: SdkChange[],
): void {
  walkAllObjects(node, path, (n, p) => {
    if (Array.isArray(n['allOf']) && n['allOf'].length === 1) {
      const inner = n['allOf'][0] as Record<string, unknown>;
      if (inner && typeof inner === 'object') {
        delete n['allOf'];
        Object.assign(n, inner);
        addChange(
          changes,
          `${p}/allOf`,
          'removed',
          `Unwrapped single-entry allOf`,
          [inner],
          undefined,
        );
      }
    }
  });
}

function checkForUnsupportedKeywords(
  schema: Record<string, unknown>,
  keywords: string[],
  gaps: SdkGap[],
): void {
  const found = new Set<string>();
  walkAllObjects(schema, '', (node) => {
    for (const kw of keywords) {
      if (kw in node) found.add(kw);
    }
  });

  for (const kw of found) {
    gaps.push({
      rule: `unsupported_keyword_${kw}`,
      description: `OpenAI SDK does not strip "${kw}". This keyword is not supported by OpenAI strict mode and will cause a 400 error.`,
      willCauseError: true,
    });
  }
}
