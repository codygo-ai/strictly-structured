type SchemaNode = Record<string, unknown>;

const JSON_SCHEMA_TO_PYTHON: Record<string, string> = {
  string: "str",
  integer: "int",
  number: "float",
  boolean: "bool",
  null: "None",
};

const FORMAT_TO_PYTHON: Record<string, { type: string; import: string }> = {
  "date-time": { type: "datetime", import: "from datetime import datetime" },
  date: { type: "date", import: "from datetime import date" },
  time: { type: "time", import: "from datetime import time" },
  uuid: { type: "UUID", import: "from uuid import UUID" },
  decimal: { type: "Decimal", import: "from decimal import Decimal" },
};

interface GeneratorContext {
  imports: Set<string>;
  models: string[];
  modelNames: Set<string>;
}

export function jsonSchemaToPydantic(
  schema: SchemaNode,
  opts?: { className?: string },
): string {
  const ctx: GeneratorContext = {
    imports: new Set(["from pydantic import BaseModel, Field"]),
    models: [],
    modelNames: new Set(),
  };

  const rootName = opts?.className ?? inferClassName(schema) ?? "Model";
  generateModel(schema, rootName, ctx);

  const importLines = [...ctx.imports].sort().join("\n");
  const modelCode = ctx.models.join("\n\n");

  return `${importLines}\n\n\n${modelCode}\n`;
}

function generateModel(
  schema: SchemaNode,
  className: string,
  ctx: GeneratorContext,
): void {
  if (ctx.modelNames.has(className)) return;
  ctx.modelNames.add(className);

  const properties = schema["properties"] as Record<string, SchemaNode> | undefined;
  const required = new Set(
    Array.isArray(schema["required"]) ? (schema["required"] as string[]) : [],
  );

  if (!properties || Object.keys(properties).length === 0) {
    ctx.models.push(`class ${className}(BaseModel):\n    pass`);
    return;
  }

  const lines = [`class ${className}(BaseModel):`];

  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required.has(propName);
    const { typeStr, fieldArgs } = resolvePropertyType(
      propSchema,
      propName,
      className,
      ctx,
    );

    const pythonName = toSnakeCase(propName);
    const aliasNeeded = pythonName !== propName;

    const allFieldArgs = [...fieldArgs];
    if (aliasNeeded) {
      allFieldArgs.push(`alias="${propName}"`);
    }

    if (!isRequired) {
      ctx.imports.add("from typing import Optional");
      const optionalType = `Optional[${typeStr}]`;
      if (allFieldArgs.length > 0) {
        lines.push(
          `    ${pythonName}: ${optionalType} = Field(default=None, ${allFieldArgs.join(", ")})`,
        );
      } else {
        lines.push(`    ${pythonName}: ${optionalType} = None`);
      }
    } else if (allFieldArgs.length > 0) {
      lines.push(
        `    ${pythonName}: ${typeStr} = Field(..., ${allFieldArgs.join(", ")})`,
      );
    } else {
      lines.push(`    ${pythonName}: ${typeStr}`);
    }
  }

  const description = schema["description"];
  if (typeof description === "string") {
    const safeDesc = description.replace(/"""/g, '\\"\\"\\"');
    lines.splice(1, 0, `    """${safeDesc}"""`);
  }

  ctx.models.push(lines.join("\n"));
}

function resolvePropertyType(
  schema: SchemaNode,
  propName: string,
  parentClass: string,
  ctx: GeneratorContext,
): { typeStr: string; fieldArgs: string[] } {
  const fieldArgs: string[] = [];

  // Handle description
  if (typeof schema["description"] === "string") {
    fieldArgs.push(`description="${escapeString(schema["description"] as string)}"`);
  }

  // Handle anyOf (union types)
  if (Array.isArray(schema["anyOf"])) {
    const branches = schema["anyOf"] as SchemaNode[];
    const types = branches
      .filter((b) => b["type"] !== "null")
      .map((b) => resolvePropertyType(b, propName, parentClass, ctx).typeStr);
    const hasNull = branches.some((b) => b["type"] === "null");

    if (types.length === 1 && hasNull) {
      ctx.imports.add("from typing import Optional");
      return { typeStr: `Optional[${types[0]}]`, fieldArgs };
    }
    if (types.length > 1) {
      ctx.imports.add("from typing import Union");
      return { typeStr: `Union[${types.join(", ")}]`, fieldArgs };
    }
    if (types.length === 1) {
      return { typeStr: types[0], fieldArgs };
    }
  }

  // Handle enum
  if (Array.isArray(schema["enum"])) {
    const values = schema["enum"] as unknown[];
    if (values.every((v) => typeof v === "string")) {
      ctx.imports.add("from typing import Literal");
      const literals = values.map((v) => `"${v}"`).join(", ");
      return { typeStr: `Literal[${literals}]`, fieldArgs };
    }
  }

  // Handle const
  if ("const" in schema) {
    ctx.imports.add("from typing import Literal");
    const val = schema["const"];
    const literal = typeof val === "string" ? `"${val}"` : String(val);
    return { typeStr: `Literal[${literal}]`, fieldArgs };
  }

  const nodeType = schema["type"];

  // Handle array
  if (nodeType === "array") {
    const items = schema["items"] as SchemaNode | undefined;
    if (items) {
      const inner = resolvePropertyType(items, propName, parentClass, ctx);
      return { typeStr: `list[${inner.typeStr}]`, fieldArgs: [...fieldArgs, ...inner.fieldArgs] };
    }
    return { typeStr: "list", fieldArgs };
  }

  // Handle nested object → create a sub-model
  if (nodeType === "object" || schema["properties"] !== undefined) {
    const subClassName = toPascalCase(propName);
    const uniqueName = ctx.modelNames.has(subClassName)
      ? `${parentClass}${subClassName}`
      : subClassName;
    generateModel(schema, uniqueName, ctx);
    return { typeStr: uniqueName, fieldArgs };
  }

  // Handle format
  if (typeof schema["format"] === "string") {
    const formatInfo = FORMAT_TO_PYTHON[schema["format"]];
    if (formatInfo) {
      ctx.imports.add(formatInfo.import);
      return { typeStr: formatInfo.type, fieldArgs };
    }
  }

  // Handle constraints as Field args
  if (typeof schema["minLength"] === "number") {
    fieldArgs.push(`min_length=${schema["minLength"]}`);
  }
  if (typeof schema["maxLength"] === "number") {
    fieldArgs.push(`max_length=${schema["maxLength"]}`);
  }
  if (typeof schema["minimum"] === "number") {
    fieldArgs.push(`ge=${schema["minimum"]}`);
  }
  if (typeof schema["maximum"] === "number") {
    fieldArgs.push(`le=${schema["maximum"]}`);
  }
  if (typeof schema["exclusiveMinimum"] === "number") {
    fieldArgs.push(`gt=${schema["exclusiveMinimum"]}`);
  }
  if (typeof schema["exclusiveMaximum"] === "number") {
    fieldArgs.push(`lt=${schema["exclusiveMaximum"]}`);
  }
  if (typeof schema["pattern"] === "string") {
    fieldArgs.push(`pattern="${escapeString(schema["pattern"] as string)}"`);
  }

  // Handle nullable type array like ["string", "null"]
  if (Array.isArray(nodeType)) {
    const nonNull = (nodeType as string[]).filter((t) => t !== "null");
    const hasNull = (nodeType as string[]).includes("null");
    if (nonNull.length === 1) {
      const pyType = JSON_SCHEMA_TO_PYTHON[nonNull[0]] ?? "Any";
      if (hasNull) {
        ctx.imports.add("from typing import Optional");
        return { typeStr: `Optional[${pyType}]`, fieldArgs };
      }
      return { typeStr: pyType, fieldArgs };
    }
  }

  // Simple type mapping
  if (typeof nodeType === "string") {
    const pyType = JSON_SCHEMA_TO_PYTHON[nodeType];
    if (pyType) return { typeStr: pyType, fieldArgs };
  }

  // Fallback
  ctx.imports.add("from typing import Any");
  return { typeStr: "Any", fieldArgs };
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
    .replace(/-/g, "_");
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) =>
      c ? c.toUpperCase() : "",
    )
    .replace(/^./, (c) => c.toUpperCase());
}

function inferClassName(schema: SchemaNode): string | undefined {
  if (typeof schema["title"] === "string") {
    return toPascalCase(schema["title"]);
  }
  return undefined;
}

function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
