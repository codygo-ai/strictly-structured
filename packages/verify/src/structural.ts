import metaSchema from '@ssv/schemas/data/versionAggregatedJsonSchema.json' with { type: 'json' };
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });

// The meta-schema's $id collides with AJV's built-in draft-07; remove it so AJV treats it as a standalone schema
const { $id: _, ...schemaWithoutId } = metaSchema as Record<string, unknown>;
const validate = ajv.compile(schemaWithoutId);

export function validateStructural(schema: unknown): { valid: boolean; errors: string[] } {
  const valid = validate(schema);
  if (valid) return { valid: true, errors: [] };

  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? 'unknown error'}`,
  );
  return { valid: false, errors };
}
