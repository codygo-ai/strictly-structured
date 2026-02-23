import ruleSetsDataJson from '@ssv/schemas/data/schemaRuleSets.json';
import { fixSchemaForRuleSet } from '@ssv/schemas/ruleSetFixer';
import { validateSchemaForRuleSet, type SchemaMarker } from '@ssv/schemas/ruleSetValidator';
import type { SchemaRuleSetsData, SchemaRuleSet } from '@ssv/schemas/types';

const ruleSetsData = ruleSetsDataJson as unknown as SchemaRuleSetsData;
const RULE_SETS: SchemaRuleSet[] = ruleSetsData.ruleSets;

export interface ServerRuleSetResult {
  ruleSetId: string;
  valid: boolean;
  errorCount: number;
  warningCount: number;
}

function isValidJson(schema: string): boolean {
  try {
    JSON.parse(schema);
    return true;
  } catch {
    return false;
  }
}

function isValidJsonSchema(schema: string): boolean {
  if (!isValidJson(schema)) return false;
  try {
    const parsed = JSON.parse(schema) as Record<string, unknown>;
    return typeof parsed === 'object' && parsed !== null && 'type' in parsed;
  } catch {
    return false;
  }
}

export function getServerValidationResults(schema: string): ServerRuleSetResult[] {
  const validJson = isValidJson(schema);
  const validJsonSchema = isValidJsonSchema(schema);

  return RULE_SETS.map((rs) => {
    const markers = validJson && validJsonSchema ? validateSchemaForRuleSet(schema, rs) : [];
    const errorCount = markers.filter((m: SchemaMarker) => m.severity === 'error').length;
    const warningCount = markers.filter((m: SchemaMarker) => m.severity === 'warning').length;
    const valid = validJson && validJsonSchema && errorCount === 0;
    return {
      ruleSetId: rs.ruleSetId,
      valid,
      errorCount,
      warningCount,
    };
  });
}

/** Returns normalized JSON string of the fixed schema for a rule set (canonical fix via fixSchemaForRuleSet). */
export function getServerFixedSchema(schema: string, ruleSetId: string): string {
  const ruleSet = RULE_SETS.find((rs) => rs.ruleSetId === ruleSetId);
  if (!ruleSet) throw new Error(`Unknown ruleSetId: ${ruleSetId}`);
  const parsed = JSON.parse(schema) as Record<string, unknown>;
  const result = fixSchemaForRuleSet(parsed, ruleSet);
  return JSON.stringify(JSON.parse(JSON.stringify(result.fixedSchema)), null, 2);
}
