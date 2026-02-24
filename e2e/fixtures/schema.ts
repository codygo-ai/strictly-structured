import invalidAll from './invalid-all.json';
import invalidOpenAi from './invalid-openai.json';

export const INVALID_SCHEMA_ID = 'invalid-openai';

export const INVALID_SCHEMA = JSON.stringify(invalidOpenAi, null, 2);

export const INVALID_FOR_ALL_SCHEMA_ID = 'invalid-all';

export const INVALID_FOR_ALL_SCHEMA = JSON.stringify(invalidAll, null, 2);

export const E2E_SCHEMA_ID = INVALID_FOR_ALL_SCHEMA_ID;
export const E2E_SCHEMA = INVALID_FOR_ALL_SCHEMA;

export function schemaToBase64(schema: string): string {
  return Buffer.from(schema, 'utf-8').toString('base64');
}
