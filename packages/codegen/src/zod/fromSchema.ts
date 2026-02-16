import { jsonSchemaToZod as jsonSchemaToZodLib } from 'json-schema-to-zod';

export function jsonSchemaToZod(schema: Record<string, unknown>): string {
  const zodCode = jsonSchemaToZodLib(schema, {
    module: 'esm',
    type: true,
  });

  return zodCode;
}
