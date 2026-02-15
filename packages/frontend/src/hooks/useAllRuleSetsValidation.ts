"use client";

import { useEffect, useRef, useState } from "react";
import type { SchemaRuleSet } from "~/types/schemaRuleSets";
import {
  validateSchemaForRuleSet,
  type SchemaMarker,
} from "~/lib/ruleSetValidator";

export interface RuleSetValidationSummary {
  errorCount: number;
  warningCount: number;
  infoCount: number;
  markers: SchemaMarker[];
}

const DEBOUNCE_MS = 200;

export function useAllRuleSetsValidation(
  schema: string,
  ruleSets: SchemaRuleSet[],
): Map<string, RuleSetValidationSummary> {
  const [results, setResults] = useState<Map<string, RuleSetValidationSummary>>(
    () => new Map(),
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const next = new Map<string, RuleSetValidationSummary>();

      for (const rs of ruleSets) {
        const markers = validateSchemaForRuleSet(schema, rs);
        const errorCount = markers.filter((m) => m.severity === "error").length;
        const warningCount = markers.filter(
          (m) => m.severity === "warning",
        ).length;
        const infoCount = markers.length - errorCount - warningCount;
        next.set(rs.ruleSetId, { errorCount, warningCount, infoCount, markers });
      }

      setResults(next);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [schema, ruleSets]);

  return results;
}
