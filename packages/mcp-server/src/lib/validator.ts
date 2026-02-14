import jsonSourceMap from "json-source-map";
import type { StructuredOutputGroup } from "./groups";

export interface SchemaMarker {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: "error" | "warning" | "info";
}

interface ValidatorRules {
  rootType: string | string[];
  rootAnyOfAllowed: boolean;
  allFieldsRequired: boolean;
  additionalPropertiesMustBeFalse: boolean;
  additionalPropertiesFalseRecommended?: boolean;
  supportedStringFormats: string[];
  limits?: {
    maxProperties?: number | null;
    maxNestingDepth?: number | null;
    maxStringLengthNamesEnums?: number | null;
    maxEnumValues?: number | null;
  };
}

interface SourcePos {
  line: number;
  column: number;
}

interface PointerEntry {
  key?: SourcePos;
  keyEnd?: SourcePos;
  value: SourcePos;
  valueEnd: SourcePos;
}

type PointerMap = Record<string, PointerEntry>;

interface WalkContext {
  rules: ValidatorRules;
  pointers: PointerMap;
  markers: SchemaMarker[];
  supportedComposition: Set<string>;
  supportedKeywordsByType: Map<string, Set<string>>;
  supportedTypesSet: Set<string>;
  totalProperties: number;
  maxDepthSeen: number;
  totalEnumValues: number;
  totalStringLengthNamesEnums: number;
}

const COMPOSITION_KEYWORDS = new Set([
  "anyOf",
  "allOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
  "dependentRequired",
  "dependentSchemas",
  "$ref",
  "$defs",
]);

const STRUCTURAL_KEYWORDS = new Set(["type"]);

function buildSupportedKeywordsByType(
  supportedTypes: StructuredOutputGroup["supportedTypes"]
): Map<string, Set<string>> {
  return new Map(
    supportedTypes.map((st) => [st.type, new Set(st.supportedKeywords)])
  );
}

function resolveType(node: Record<string, unknown>): string | null {
  const t = node["type"];
  if (typeof t === "string") return t;
  if (Array.isArray(t)) {
    const nonNull = t.filter((v) => v !== "null");
    if (nonNull.length === 1 && typeof nonNull[0] === "string") return nonNull[0];
  }
  return null;
}

function pointerToMarker(
  pointers: PointerMap,
  pointer: string,
  fallbackPointer: string,
  message: string,
  severity: SchemaMarker["severity"]
): SchemaMarker {
  const entry = pointers[pointer] ?? pointers[fallbackPointer] ?? pointers[""];
  const start = entry?.key ?? entry?.value ?? { line: 0, column: 0 };
  const end = entry?.keyEnd ?? entry?.valueEnd ?? { line: 0, column: 1 };
  return {
    startLineNumber: start.line + 1,
    startColumn: start.column + 1,
    endLineNumber: end.line + 1,
    endColumn: end.column + 1,
    message,
    severity,
  };
}

export function validateSchemaForGroup(
  raw: string,
  group: StructuredOutputGroup | undefined
): SchemaMarker[] {
  if (!group) return [];

  let parsed: { data: unknown; pointers: PointerMap };
  try {
    parsed = jsonSourceMap.parse(raw);
  } catch {
    return [];
  }

  const { data, pointers } = parsed;
  if (data === null || typeof data !== "object") return [];

  const rules: ValidatorRules = {
    rootType: group.rootType,
    rootAnyOfAllowed: group.rootAnyOfAllowed,
    allFieldsRequired: group.allFieldsRequired,
    additionalPropertiesMustBeFalse: group.additionalPropertiesMustBeFalse,
    additionalPropertiesFalseRecommended: group.additionalPropertiesFalseRecommended,
    supportedStringFormats: group.stringFormats ?? [],
    limits: {
      maxProperties: group.limits.maxProperties,
      maxNestingDepth: group.limits.maxNestingDepth,
      maxStringLengthNamesEnums: group.limits.maxStringLengthNamesEnums ?? null,
      maxEnumValues: group.limits.maxEnumValues ?? null,
    },
  };

  const ctx: WalkContext = {
    rules,
    pointers,
    markers: [],
    supportedComposition: new Set(group.composition?.supported ?? []),
    supportedKeywordsByType: buildSupportedKeywordsByType(group.supportedTypes),
    supportedTypesSet: new Set(group.supportedTypes.map((st) => st.type)),
    totalProperties: 0,
    maxDepthSeen: 0,
    totalEnumValues: 0,
    totalStringLengthNamesEnums: 0,
  };

  walkNode(data as Record<string, unknown>, "", 0, true, ctx);
  checkQuantitativeLimits(ctx);

  return ctx.markers;
}

function walkNode(
  node: Record<string, unknown>,
  pointer: string,
  depth: number,
  isRoot: boolean,
  ctx: WalkContext
): void {
  if (depth > ctx.maxDepthSeen) ctx.maxDepthSeen = depth;

  const nodeType = resolveType(node);

  const rawType = node["type"];
  if (Array.isArray(rawType)) {
    const nonNull = rawType.filter((v) => v !== "null");
    if (nonNull.length > 1) {
      ctx.markers.push(
        pointerToMarker(
          ctx.pointers,
          `${pointer}/type`,
          pointer,
          `Multi-type unions are not supported. Use anyOf for union types`,
          "error"
        )
      );
    }
  }

  if (isRoot) checkRootConstraints(node, nodeType, ctx);

  if (nodeType && !ctx.supportedTypesSet.has(nodeType)) {
    ctx.markers.push(
      pointerToMarker(
        ctx.pointers,
        `${pointer}/type`,
        pointer,
        `Type "${nodeType}" is not supported by this provider`,
        "error"
      )
    );
  }

  checkNodeKeywords(node, nodeType, pointer, isRoot, ctx);

  if (nodeType === "object" || node["properties"] !== undefined) {
    checkObjectConstraints(node, pointer, ctx);
  }

  if (nodeType === "string" && typeof node["format"] === "string") {
    checkStringFormat(node["format"], pointer, ctx);
  }

  accumulateStats(node, ctx);
  recurseChildren(node, pointer, depth, ctx);
}

function checkRootConstraints(
  node: Record<string, unknown>,
  nodeType: string | null,
  ctx: WalkContext
): void {
  const { rules, pointers, markers } = ctx;
  const allowedRoots = Array.isArray(rules.rootType)
    ? rules.rootType
    : [rules.rootType];

  if (nodeType && !allowedRoots.includes(nodeType)) {
    markers.push(
      pointerToMarker(
        pointers,
        "/type",
        "",
        `Root type must be ${allowedRoots.join(" or ")}, got "${nodeType}"`,
        "error"
      )
    );
  }

  if (
    !rules.rootAnyOfAllowed &&
    node["anyOf"] !== undefined &&
    ctx.supportedComposition.has("anyOf")
  ) {
    markers.push(
      pointerToMarker(
        pointers,
        "/anyOf",
        "",
        "Root-level anyOf is not allowed for this provider",
        "error"
      )
    );
  }
}

function checkNodeKeywords(
  node: Record<string, unknown>,
  nodeType: string | null,
  pointer: string,
  isRoot: boolean,
  ctx: WalkContext
): void {
  const { pointers, markers, supportedComposition } = ctx;
  const typeSupported = nodeType
    ? ctx.supportedKeywordsByType.get(nodeType)
    : null;

  for (const key of Object.keys(node)) {
    if (STRUCTURAL_KEYWORDS.has(key)) continue;

    if (COMPOSITION_KEYWORDS.has(key)) {
      if (isRoot && key === "anyOf" && supportedComposition.has("anyOf")) {
        continue;
      }
      if (!supportedComposition.has(key)) {
        markers.push(
          pointerToMarker(
            pointers,
            `${pointer}/${escapePointer(key)}`,
            pointer,
            `"${key}" is not supported by this provider`,
            "error"
          )
        );
      }
      continue;
    }

    if (typeSupported && !typeSupported.has(key)) {
      markers.push(
        pointerToMarker(
          pointers,
          `${pointer}/${escapePointer(key)}`,
          pointer,
          `"${key}" is not supported for type "${nodeType}" by this provider`,
          "error"
        )
      );
    }
  }
}

function checkObjectConstraints(
  node: Record<string, unknown>,
  pointer: string,
  ctx: WalkContext
): void {
  const { rules, pointers, markers } = ctx;

  if (rules.additionalPropertiesMustBeFalse && node["additionalProperties"] !== false) {
    if (node["additionalProperties"] === undefined) {
      markers.push(
        pointerToMarker(
          pointers,
          `${pointer}/properties`,
          pointer,
          `Missing "additionalProperties": false — required by this provider`,
          "error"
        )
      );
    } else {
      markers.push(
        pointerToMarker(
          pointers,
          `${pointer}/additionalProperties`,
          pointer,
          `"additionalProperties" must be false for this provider`,
          "error"
        )
      );
    }
  }

  if (
    !rules.additionalPropertiesMustBeFalse &&
    rules.additionalPropertiesFalseRecommended &&
    node["additionalProperties"] !== false &&
    node["properties"] !== undefined
  ) {
    markers.push(
      pointerToMarker(
        pointers,
        `${pointer}/properties`,
        pointer,
        `"additionalProperties": false is recommended by this provider for reliable results`,
        "warning"
      )
    );
  }

  if (rules.allFieldsRequired && node["properties"] !== undefined) {
    const props = node["properties"];
    if (props && typeof props === "object") {
      const propKeys = Object.keys(props);
      const required = Array.isArray(node["required"])
        ? (node["required"] as string[])
        : [];
      const missing = propKeys.filter((k) => !required.includes(k));
      if (missing.length > 0) {
        markers.push(
          pointerToMarker(
            pointers,
            `${pointer}/required`,
            `${pointer}/properties`,
            `All properties must be in "required" for this provider. Missing: ${missing.join(", ")}`,
            "error"
          )
        );
      }
    }
  }
}

function checkStringFormat(
  format: string,
  pointer: string,
  ctx: WalkContext
): void {
  const formats = ctx.rules.supportedStringFormats;
  if (!formats || formats.length === 0) return;

  if (!formats.includes(format)) {
    ctx.markers.push(
      pointerToMarker(
        ctx.pointers,
        `${pointer}/format`,
        pointer,
        `String format "${format}" is not supported. Supported: ${formats.join(", ")}`,
        "error"
      )
    );
  }
}

function accumulateStats(
  node: Record<string, unknown>,
  ctx: WalkContext
): void {
  if (node["properties"] && typeof node["properties"] === "object") {
    const keys = Object.keys(node["properties"] as Record<string, unknown>);
    ctx.totalProperties += keys.length;
    for (const key of keys) {
      ctx.totalStringLengthNamesEnums += key.length;
    }
  }

  if (Array.isArray(node["enum"])) {
    const enumArr = node["enum"] as unknown[];
    ctx.totalEnumValues += enumArr.length;
    for (const val of enumArr) {
      if (typeof val === "string") {
        ctx.totalStringLengthNamesEnums += val.length;
      }
    }
  }
}

function recurseChildren(
  node: Record<string, unknown>,
  pointer: string,
  depth: number,
  ctx: WalkContext
): void {
  if (node["properties"] && typeof node["properties"] === "object") {
    const props = node["properties"] as Record<string, unknown>;
    for (const [key, value] of Object.entries(props)) {
      if (value && typeof value === "object") {
        walkNode(
          value as Record<string, unknown>,
          `${pointer}/properties/${escapePointer(key)}`,
          depth + 1,
          false,
          ctx
        );
      }
    }
  }

  if (node["items"] && typeof node["items"] === "object") {
    walkNode(
      node["items"] as Record<string, unknown>,
      `${pointer}/items`,
      depth + 1,
      false,
      ctx
    );
  }

  if (Array.isArray(node["prefixItems"])) {
    (node["prefixItems"] as unknown[]).forEach((item, i) => {
      if (item && typeof item === "object") {
        walkNode(
          item as Record<string, unknown>,
          `${pointer}/prefixItems/${i}`,
          depth + 1,
          false,
          ctx
        );
      }
    });
  }

  if (Array.isArray(node["anyOf"])) {
    (node["anyOf"] as unknown[]).forEach((branch, i) => {
      if (branch && typeof branch === "object") {
        walkNode(
          branch as Record<string, unknown>,
          `${pointer}/anyOf/${i}`,
          depth,
          false,
          ctx
        );
      }
    });
  }

  if (node["$defs"] && typeof node["$defs"] === "object") {
    const defs = node["$defs"] as Record<string, unknown>;
    for (const [key, value] of Object.entries(defs)) {
      if (value && typeof value === "object") {
        walkNode(
          value as Record<string, unknown>,
          `${pointer}/$defs/${escapePointer(key)}`,
          0,
          false,
          ctx
        );
      }
    }
  }

  if (
    node["additionalProperties"] &&
    typeof node["additionalProperties"] === "object"
  ) {
    walkNode(
      node["additionalProperties"] as Record<string, unknown>,
      `${pointer}/additionalProperties`,
      depth + 1,
      false,
      ctx
    );
  }
}

function checkQuantitativeLimits(ctx: WalkContext): void {
  const limits = ctx.rules.limits;
  if (!limits) return;

  if (
    typeof limits.maxProperties === "number" &&
    ctx.totalProperties > limits.maxProperties
  ) {
    ctx.markers.push(
      pointerToMarker(ctx.pointers, "", "", `Schema has ${ctx.totalProperties} total properties, exceeding the limit of ${limits.maxProperties}`, "error")
    );
  }

  if (
    typeof limits.maxNestingDepth === "number" &&
    ctx.maxDepthSeen > limits.maxNestingDepth
  ) {
    ctx.markers.push(
      pointerToMarker(ctx.pointers, "", "", `Schema nesting depth is ${ctx.maxDepthSeen}, exceeding the limit of ${limits.maxNestingDepth}`, "error")
    );
  }

  if (
    typeof limits.maxEnumValues === "number" &&
    ctx.totalEnumValues > limits.maxEnumValues
  ) {
    ctx.markers.push(
      pointerToMarker(ctx.pointers, "", "", `Schema has ${ctx.totalEnumValues} total enum values, exceeding the limit of ${limits.maxEnumValues}`, "error")
    );
  }

  if (
    typeof limits.maxStringLengthNamesEnums === "number" &&
    ctx.totalStringLengthNamesEnums > limits.maxStringLengthNamesEnums
  ) {
    ctx.markers.push(
      pointerToMarker(ctx.pointers, "", "", `Total string length of property names and enum values is ${ctx.totalStringLengthNamesEnums}, exceeding the limit of ${limits.maxStringLengthNamesEnums}`, "error")
    );
  }
}

function escapePointer(key: string): string {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}
