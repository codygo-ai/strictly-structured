import jsonSourceMap from "json-source-map";
import { pathToJsonPointer } from "@ssv/schema-utils";
import type { ValidationIssue } from "@ssv/schema-utils";
import type { SchemaValidityError } from "@ssv/schema-utils";

export interface MonacoRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface DiagnosticWithRange {
  range: MonacoRange;
  message: string;
}

type PointerMap = Record<
  string,
  {
    key?: { line: number; column: number };
    keyEnd?: { line: number; column: number };
    value?: { line: number; column: number };
    valueEnd?: { line: number; column: number };
  }
>;

function parsePointers(schemaString: string): PointerMap | null {
  try {
    const result = jsonSourceMap.parse(schemaString);
    return (result.pointers ?? {}) as PointerMap;
  } catch {
    return null;
  }
}

/**
 * Map validation issues (keyword not in selection) to Monaco ranges (key position).
 */
export function getMonacoRangesForIssues(
  schemaString: string,
  issues: ValidationIssue[]
): DiagnosticWithRange[] {
  const pointers = parsePointers(schemaString);
  if (!pointers) return [];

  const out: DiagnosticWithRange[] = [];
  for (const issue of issues) {
    const pointer = pathToJsonPointer(issue.path);
    const loc = pointers[pointer];
    if (!loc?.key || !loc?.keyEnd) continue;
    const message = issue.suggestion
      ? `${issue.message}\n→ ${issue.suggestion}`
      : issue.message;
    out.push({
      range: {
        startLineNumber: loc.key.line + 1,
        startColumn: loc.key.column + 1,
        endLineNumber: loc.keyEnd.line + 1,
        endColumn: loc.keyEnd.column + 1,
      },
      message,
    });
  }
  return out;
}

/**
 * Map schema validity errors (JSON pointer) to Monaco ranges.
 * Uses key range when useKeyRange is true (e.g. unknown keyword), else value range.
 */
export function getMonacoRangesForSchemaErrors(
  schemaString: string,
  errors: SchemaValidityError[]
): DiagnosticWithRange[] {
  const pointers = parsePointers(schemaString);
  if (!pointers) return [];

  const out: DiagnosticWithRange[] = [];
  for (const err of errors) {
    const pointer = err.path || "";
    const loc = pointers[pointer];
    const useKey = err.useKeyRange && loc?.key && loc?.keyEnd;
    if (useKey) {
      out.push({
        range: {
          startLineNumber: loc.key!.line + 1,
          startColumn: loc.key!.column + 1,
          endLineNumber: loc.keyEnd!.line + 1,
          endColumn: loc.keyEnd!.column + 1,
        },
        message: err.message,
      });
    } else if (loc?.value && loc?.valueEnd) {
      out.push({
        range: {
          startLineNumber: loc.value.line + 1,
          startColumn: loc.value.column + 1,
          endLineNumber: loc.valueEnd.line + 1,
          endColumn: loc.valueEnd.column + 1,
        },
        message: err.message,
      });
    }
  }
  return out;
}
