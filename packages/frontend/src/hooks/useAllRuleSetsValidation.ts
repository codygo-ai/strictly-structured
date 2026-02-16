'use client';

import { validateSchemaForRuleSet, type SchemaMarker } from '@ssv/schemas/ruleSetValidator';
import type { SchemaRuleSet } from '@ssv/schemas/types';
import { useEffect, useRef, useState } from 'react';

export interface RuleSetValidationSummary {
  errorCount: number;
  warningCount: number;
  infoCount: number;
  markers: SchemaMarker[];
  isValidJson: boolean;
  isValidJsonSchema: boolean;
}

const DEBOUNCE_MS = 200;

export function useAllRuleSetsValidation(
  schema: string,
  ruleSets: SchemaRuleSet[],
  isValidJsonSchema: boolean,
): Map<string, RuleSetValidationSummary> {
  const [results, setResults] = useState<Map<string, RuleSetValidationSummary>>(() => new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const next = new Map<string, RuleSetValidationSummary>();

      let isValidJson = true;
      try {
        JSON.parse(schema);
      } catch {
        isValidJson = false;
      }

      for (const rs of ruleSets) {
        const markers = isValidJsonSchema ? validateSchemaForRuleSet(schema, rs) : [];
        const errorCount = markers.filter((m) => m.severity === 'error').length;
        const warningCount = markers.filter((m) => m.severity === 'warning').length;
        const infoCount = markers.length - errorCount - warningCount;
        next.set(rs.ruleSetId, {
          errorCount,
          warningCount,
          infoCount,
          markers,
          isValidJson,
          isValidJsonSchema,
        });
      }

      setResults(next);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [schema, ruleSets, isValidJsonSchema]);

  return results;
}
