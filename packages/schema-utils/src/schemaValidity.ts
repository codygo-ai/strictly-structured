import Ajv, { type ErrorObject } from "ajv";
import { JSON_SCHEMA_KEYWORDS } from "./types.js";

export interface SchemaValidityError {
  /** JSON Pointer into the schema (e.g. "/properties/count/type") */
  path: string;
  message: string;
  /** If true, underline the key at path; otherwise the value (default). */
  useKeyRange?: boolean;
}

const KNOWN_KEYWORDS = new Set<string>(JSON_SCHEMA_KEYWORDS);
const PROPERTY_CONTAINER_KEYS = new Set(["properties", "patternProperties"]);

function pathToPointer(path: string): string {
  if (!path) return "";
  const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  return "/" + segments.join("/");
}

/**
 * Report unknown keywords (e.g. "properties333"). At "properties" / "patternProperties"
 * values, keys are property names or patterns, so we allow any key there.
 */
function collectUnknownKeywordErrors(
  obj: unknown,
  path: string,
  parentKey: string,
  errors: SchemaValidityError[]
): void {
  if (obj === null || typeof obj !== "object") return;
  const record = obj as Record<string, unknown>;
  const isPropertyContainer = PROPERTY_CONTAINER_KEYS.has(parentKey);

  for (const key of Object.keys(record)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (!isPropertyContainer && !KNOWN_KEYWORDS.has(key)) {
      errors.push({
        path: pathToPointer(fullPath),
        message: `Unknown keyword "${key}". Did you mean "properties"?`,
        useKeyRange: true,
      });
    }
    const value = record[key];
    if (value !== null && typeof value === "object") {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          collectUnknownKeywordErrors(
            value[i],
            `${fullPath}[${i}]`,
            key,
            errors
          );
        }
      } else {
        collectUnknownKeywordErrors(value, fullPath, key, errors);
      }
    }
  }
}

/**
 * Report when "required" lists a name that is not in "properties".
 */
function collectRequiredNotInPropertiesErrors(
  obj: unknown,
  path: string,
  errors: SchemaValidityError[]
): void {
  if (obj === null || typeof obj !== "object") return;
  const record = obj as Record<string, unknown>;

  const properties = record.properties;
  const required = record.required;
  if (
    properties !== null &&
    typeof properties === "object" &&
    Array.isArray(required)
  ) {
    const propKeys = new Set(Object.keys(properties as Record<string, unknown>));
    for (let i = 0; i < required.length; i++) {
      const name = required[i];
      if (typeof name === "string" && !propKeys.has(name)) {
        errors.push({
          path: pathToPointer(path ? `${path}.required[${i}]` : `required[${i}]`),
          message: `"required" lists "${name}" but it is not in "properties".`,
        });
      }
    }
  }

  for (const key of Object.keys(record)) {
    const fullPath = path ? `${path}.${key}` : key;
    const value = record[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      collectRequiredNotInPropertiesErrors(
        value as Record<string, unknown>,
        fullPath,
        errors
      );
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (item !== null && typeof item === "object") {
          collectRequiredNotInPropertiesErrors(
            item as Record<string, unknown>,
            `${fullPath}[${i}]`,
            errors
          );
        }
      }
    }
  }
}

function getCustomSchemaValidityErrors(schema: object): SchemaValidityError[] {
  const errors: SchemaValidityError[] = [];
  collectUnknownKeywordErrors(schema, "", "", errors);
  collectRequiredNotInPropertiesErrors(schema, "", errors);
  return errors;
}

const ajv = new Ajv({ strict: false, allErrors: true });

/**
 * Validate that the document is valid JSON Schema (draft-07 by default),
 * plus custom rules: no unknown keywords, and "required" must only list keys from "properties".
 */
export function validateJsonSchema(schema: object): {
  valid: boolean;
  errors: SchemaValidityError[];
} {
  ajv.validateSchema(schema);
  const ajvErrs = (ajv.errors ?? []).map((e: ErrorObject) => ({
    path: e.instancePath ?? "",
    message: e.message ?? "Invalid",
  }));
  const customErrs = getCustomSchemaValidityErrors(schema);
  const allErrors = [...ajvErrs, ...customErrs];
  if (allErrors.length === 0) return { valid: true, errors: [] };
  return { valid: false, errors: allErrors };
}
