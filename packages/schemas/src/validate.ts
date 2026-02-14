/**
 * Validates a JSON Schema against a group's rules from structured_output_groups.json.
 * Single source of truth: validity is derived only from the groups JSON.
 */

interface ValidationRule {
  path: string;
  check: string;
  value?: unknown;
  keywords?: string[];
}

export interface GroupsData {
  groups: Array<{
    groupId: string;
    rootType: string | string[];
    rootAnyOfAllowed?: boolean;
    allFieldsRequired?: boolean;
    additionalPropertiesMustBeFalse?: boolean;
    validationRules?: ValidationRule[];
    [key: string]: unknown;
  }>;
}

type SchemaNode = Record<string, unknown>;

function getRootType(schema: SchemaNode): string | undefined {
  const t = schema.type;
  if (typeof t === "string") return t;
  if (Array.isArray(t)) return t[0];
  return undefined;
}

function isRootAnyOf(schema: SchemaNode): boolean {
  return "anyOf" in schema && Array.isArray(schema.anyOf);
}

function collectNodes(
  node: unknown,
  path: string,
  acc: Array<{ node: SchemaNode; path: string; schemaType: string | undefined }>
): void {
  if (node === null || typeof node !== "object") return;
  const obj = node as SchemaNode;
  if (Array.isArray(obj)) {
    obj.forEach((child, i) => collectNodes(child, `${path}[${i}]`, acc));
    return;
  }
  const schemaType =
    typeof obj.type === "string"
      ? obj.type
      : Array.isArray(obj.type)
        ? (obj.type[0] as string)
        : undefined;
  acc.push({ node: obj, path, schemaType });
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) continue;
    const nextPath = path ? `${path}.${key}` : key;
    if (key === "properties" && typeof val === "object" && !Array.isArray(val)) {
      for (const prop of Object.keys(val as Record<string, unknown>)) {
        collectNodes((val as Record<string, unknown>)[prop], `${nextPath}.${prop}`, acc);
      }
      continue;
    }
    if (key === "items" && typeof val === "object") {
      if (Array.isArray(val)) {
        val.forEach((item, i) => collectNodes(item, `${nextPath}[${i}]`, acc));
      } else {
        collectNodes(val, nextPath, acc);
      }
      continue;
    }
    if (
      (key === "anyOf" || key === "oneOf" || key === "allOf") &&
      Array.isArray(val)
    ) {
      val.forEach((item, i) => collectNodes(item, `${nextPath}[${i}]`, acc));
      continue;
    }
    if (key === "prefixItems" && Array.isArray(val)) {
      val.forEach((item, i) => collectNodes(item, `${nextPath}[${i}]`, acc));
      continue;
    }
    if (key === "$defs" && typeof val === "object" && !Array.isArray(val)) {
      for (const def of Object.values(val as Record<string, unknown>)) {
        collectNodes(def, nextPath, acc);
      }
      continue;
    }
    if (typeof val === "object") {
      collectNodes(val, nextPath, acc);
    }
  }
}

function pathMatches(rulePath: string, nodePath: string, schemaType: string | undefined): boolean {
  if (rulePath === "$") return nodePath === "" || nodePath === "$";
  if (rulePath === "**") return true;
  if (rulePath === "**.object") return schemaType === "object";
  if (rulePath === "**.string") return schemaType === "string";
  if (rulePath === "**.array") return schemaType === "array";
  if (rulePath === "**.number") return schemaType === "number";
  if (rulePath === "**.integer") return schemaType === "integer";
  if (rulePath === "**.string.format") return schemaType === "string" && nodePath.includes("string");
  return false;
}

function checkTypeEquals(schema: SchemaNode, value: unknown): boolean {
  const allowed = value as string;
  const t = getRootType(schema);
  return t === allowed;
}

function checkTypeIn(schema: SchemaNode, value: unknown): boolean {
  const allowed = value as string[];
  const t = getRootType(schema);
  return t !== undefined && allowed.includes(t);
}

function checkNoAnyOfAtRoot(schema: SchemaNode): boolean {
  return !isRootAnyOf(schema);
}

function checkHasAdditionalPropertiesFalse(node: SchemaNode): boolean {
  if (node.type !== "object" && !(Array.isArray(node.type) && node.type.includes("object")))
    return true;
  return node.additionalProperties === false;
}

function checkAllPropertiesInRequired(node: SchemaNode): boolean {
  if (node.type !== "object" && !(Array.isArray(node.type) && node.type.includes("object")))
    return true;
  const props = node.properties as Record<string, unknown> | undefined;
  const required = node.required as string[] | undefined;
  if (!props || !Array.isArray(required)) return true;
  const propKeys = new Set(Object.keys(props));
  return required.length === propKeys.size && [...propKeys].every((k) => required.includes(k));
}

function checkNoKeywords(node: SchemaNode, keywords: string[]): boolean {
  return keywords.every((kw) => !(kw in node));
}

function checkNoComposition(node: SchemaNode, keywords: string[]): boolean {
  return keywords.every((kw) => !(kw in node));
}

function checkValueIn(node: SchemaNode, value: unknown): boolean {
  const allowed = value as string[];
  const formatVal = node.format;
  return typeof formatVal === "string" && allowed.includes(formatVal);
}

export function validateSchemaForGroup(
  schema: SchemaNode,
  groupId: string,
  groupsData: GroupsData
): { valid: boolean } {
  const group = groupsData.groups.find((g) => g.groupId === groupId);
  if (!group) return { valid: false };

  const rootType = group.rootType;
  if (!rootType) return { valid: false };

  const rootTypeArr = Array.isArray(rootType) ? rootType : [rootType];
  const rootT = getRootType(schema);
  if (!rootT || !rootTypeArr.includes(rootT)) return { valid: false };

  if (group.rootAnyOfAllowed === false && isRootAnyOf(schema)) return { valid: false };

  const nodes: Array<{ node: SchemaNode; path: string; schemaType: string | undefined }> = [];
  collectNodes(schema, "", nodes);
  const rootNode = nodes.find((n) => n.path === "" || !n.path)?.node ?? schema;

  const rules = group.validationRules ?? [];
  for (const rule of rules) {
    if (rule.check === "recommend_additional_properties_false") continue;

    const matching = nodes.filter((n) => {
      if (rule.path === "**.string.format") {
        return n.schemaType === "string" && "format" in n.node;
      }
      return pathMatches(rule.path, n.path, n.schemaType);
    });

    for (const { node } of matching) {
      if (rule.check === "type_equals" && rule.path === "$") {
        if (!checkTypeEquals(rootNode, rule.value)) return { valid: false };
        continue;
      }
      if (rule.check === "type_in" && rule.path === "$") {
        if (!checkTypeIn(rootNode, rule.value)) return { valid: false };
        continue;
      }
      if (rule.check === "no_anyOf_at_root" && rule.path === "$") {
        if (!checkNoAnyOfAtRoot(rootNode)) return { valid: false };
        continue;
      }
      if (rule.check === "has_additional_properties_false") {
        if (!checkHasAdditionalPropertiesFalse(node)) return { valid: false };
        continue;
      }
      if (rule.check === "all_properties_in_required") {
        if (!checkAllPropertiesInRequired(node)) return { valid: false };
        continue;
      }
      if (rule.check === "no_keywords" && rule.keywords) {
        if (!checkNoKeywords(node, rule.keywords)) return { valid: false };
        continue;
      }
      if (rule.check === "no_composition" && rule.keywords) {
        if (!checkNoComposition(node, rule.keywords)) return { valid: false };
        continue;
      }
      if (rule.check === "value_in" && rule.path === "**.string.format" && rule.value) {
        if (!checkValueIn(node, rule.value)) return { valid: false };
        continue;
      }
    }
  }

  return { valid: true };
}

export function getGroupIds(groupsData: GroupsData): string[] {
  return groupsData.groups.map((g) => g.groupId);
}
