import { createContext, runInContext } from 'node:vm';

import { z } from 'zod';
import { zodToJsonSchema as zodToJsonSchemaLib } from 'zod-to-json-schema';

import type { ConversionResult, ConversionWarning } from '../types';

import { scanZodCode } from './security';

export function zodToJsonSchema(zodCode: string): ConversionResult {
  const scan = scanZodCode(zodCode);
  if (!scan.safe) {
    throw new Error(`Security scan failed:\n${scan.violations.map((v) => `  - ${v}`).join('\n')}`);
  }

  // Strip import lines — we provide z in the sandbox
  const cleanCode = zodCode
    .replace(/import\s*\{?\s*z\s*\}?\s*from\s*["']zod["']\s*;?\n?/g, '')
    .replace(/import\s+type\s+.*?from\s*["']zod["']\s*;?\n?/g, '')
    .replace(/^export\s+(default\s+)?/gm, '')
    .trim();

  const sandbox = Object.create(null) as Record<string, unknown>;
  sandbox.z = z;
  const context = createContext(sandbox, {
    name: 'zod-sandbox',
    codeGeneration: { strings: false, wasm: false },
  });

  const zodSchema = extractSchema(cleanCode, context);

  if (!zodSchema || typeof zodSchema !== 'object' || !('_def' in zodSchema)) {
    throw new Error(
      'Zod code did not produce a valid Zod schema. ' +
        'The code should evaluate to a z.object(), z.string(), etc.',
    );
  }

  const warnings: ConversionWarning[] = [];
  const unsupported: string[] = [];

  const jsonSchema = zodToJsonSchemaLib(zodSchema as z.ZodTypeAny, {
    $refStrategy: 'none',
    errorMessages: false,
  });

  const schema: Record<string, unknown> = { ...jsonSchema };
  delete schema['$schema'];

  return { schema, warnings, unsupported };
}

function extractSchema(code: string, context: object): unknown {
  // Strategy 1: Direct eval — the code itself is an expression like `z.object({...})`
  // runInContext returns the completion value of the last expression
  const directResult = tryEval(code, context);
  if (isZodSchema(directResult)) return directResult;

  // Strategy 2: Named variable — find `const X = z.something(...)` and return it
  const namedMatch = code.match(/(?:const|let)\s+(\w+)\s*=\s*z\./);
  if (namedMatch?.[1]) {
    const result = tryEval(`(function() { ${code}; return ${namedMatch[1]}; })()`, context);
    if (isZodSchema(result)) return result;
  }

  return undefined;
}

function tryEval(code: string, context: object): unknown {
  try {
    return runInContext(code, context, { timeout: 5000 });
  } catch {
    return undefined;
  }
}

function isZodSchema(value: unknown): boolean {
  return value !== null && typeof value === 'object' && '_def' in value;
}
