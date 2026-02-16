import type { InputFormat } from './types';

const ZOD_PATTERNS = [
  /\bz\s*\.\s*(object|string|number|boolean|array|enum|union|literal|tuple|record|optional|nullable)\s*\(/,
  /\bz\s*\.\s*lazy\s*\(/,
  /\bimport\s*\{?\s*z\s*\}?\s*from\s*["']zod["']/,
  /\bfrom\s*["']zod["']/,
];

const PYDANTIC_PATTERNS = [
  /\bclass\s+\w+\s*\(\s*BaseModel\s*\)/,
  /\bfrom\s+pydantic\s+import\b/,
  /\bimport\s+pydantic\b/,
  /\bField\s*\(/,
  /\bmodel_validator\b/,
  /\bfield_validator\b/,
];

export function detectFormat(code: string): InputFormat {
  const trimmed = code.trim();

  // Try JSON parse first — cheapest check
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json-schema';
    } catch {
      // Not valid JSON — fall through to heuristic checks
    }
  }

  const zodScore = ZOD_PATTERNS.reduce(
    (score, pattern) => score + (pattern.test(trimmed) ? 1 : 0),
    0,
  );

  const pydanticScore = PYDANTIC_PATTERNS.reduce(
    (score, pattern) => score + (pattern.test(trimmed) ? 1 : 0),
    0,
  );

  if (zodScore > pydanticScore) return 'zod';
  if (pydanticScore > zodScore) return 'pydantic';
  if (zodScore > 0) return 'zod';

  return 'json-schema';
}
