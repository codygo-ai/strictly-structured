import type { SdkChange } from '../types';

type SchemaNode = Record<string, unknown>;

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function walkAllObjects(
  node: SchemaNode,
  path: string,
  visitor: (node: SchemaNode, path: string) => void,
): void {
  visitor(node, path);

  if (node['properties'] && typeof node['properties'] === 'object') {
    const props = node['properties'] as Record<string, unknown>;
    for (const [key, value] of Object.entries(props)) {
      if (value && typeof value === 'object') {
        walkAllObjects(value as SchemaNode, `${path}/properties/${key}`, visitor);
      }
    }
  }

  if (node['items'] && typeof node['items'] === 'object') {
    walkAllObjects(node['items'] as SchemaNode, `${path}/items`, visitor);
  }

  if (Array.isArray(node['prefixItems'])) {
    (node['prefixItems'] as unknown[]).forEach((item, i) => {
      if (item && typeof item === 'object') {
        walkAllObjects(item as SchemaNode, `${path}/prefixItems/${i}`, visitor);
      }
    });
  }

  for (const keyword of ['anyOf', 'oneOf', 'allOf']) {
    if (Array.isArray(node[keyword])) {
      (node[keyword] as unknown[]).forEach((branch, i) => {
        if (branch && typeof branch === 'object') {
          walkAllObjects(branch as SchemaNode, `${path}/${keyword}/${i}`, visitor);
        }
      });
    }
  }

  if (node['$defs'] && typeof node['$defs'] === 'object') {
    const defs = node['$defs'] as Record<string, unknown>;
    for (const [key, value] of Object.entries(defs)) {
      if (value && typeof value === 'object') {
        walkAllObjects(value as SchemaNode, `${path}/$defs/${key}`, visitor);
      }
    }
  }

  if (node['additionalProperties'] && typeof node['additionalProperties'] === 'object') {
    walkAllObjects(
      node['additionalProperties'] as SchemaNode,
      `${path}/additionalProperties`,
      visitor,
    );
  }

  if (node['not'] && typeof node['not'] === 'object') {
    walkAllObjects(node['not'] as SchemaNode, `${path}/not`, visitor);
  }
}

export function appendToDescription(node: SchemaNode, text: string): void {
  const existing = typeof node['description'] === 'string' ? node['description'] : '';
  node['description'] = existing ? `${existing}. ${text}` : text;
}

export function isObjectNode(node: SchemaNode): boolean {
  return node['type'] === 'object' || node['properties'] !== undefined;
}

export function addChange(
  changes: SdkChange[],
  path: string,
  kind: SdkChange['kind'],
  description: string,
  before?: unknown,
  after?: unknown,
): void {
  changes.push({ path, kind, description, before, after });
}

export function resolveRefs(schema: SchemaNode): SchemaNode {
  const defs = (schema['$defs'] ?? schema['definitions'] ?? {}) as Record<string, unknown>;

  function resolve(node: SchemaNode, seen: Set<string>): SchemaNode {
    if (typeof node['$ref'] === 'string') {
      const ref = node['$ref'];
      // Handle internal refs like "#/$defs/Foo" or "#/definitions/Foo"
      const match = ref.match(/^#\/(?:\$defs|definitions)\/(.+)$/);
      if (match && match[1] && !seen.has(ref)) {
        const defName = match[1];
        const def = defs[defName];
        if (def && typeof def === 'object') {
          const { $ref: _ref, ...siblings } = node;
          const resolved = resolve(
            { ...(def as SchemaNode), ...siblings },
            new Set([...seen, ref]),
          );
          return resolved;
        }
      }
      return node;
    }

    const result: SchemaNode = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === '$defs' || key === 'definitions') continue;
      if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          item && typeof item === 'object' ? resolve(item as SchemaNode, seen) : item,
        );
      } else if (value && typeof value === 'object') {
        result[key] = resolve(value as SchemaNode, seen);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return resolve(schema, new Set());
}
