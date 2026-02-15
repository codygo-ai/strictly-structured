"use client";

import type { SchemaRuleSet } from "@ssv/schemas/types";
import { ProviderIcon } from "~/components/ui";

interface RuleSetStatusCardProps {
  ruleSet: SchemaRuleSet;
  errorCount: number;
  warningCount: number;
  isValidJson: boolean;
  isValidJsonSchema: boolean;
  selected: boolean;
  onClick: () => void;
}

export function RuleSetStatusCard({
  ruleSet,
  errorCount,
  warningCount,
  isValidJson,
  isValidJsonSchema,
  selected,
  onClick,
}: RuleSetStatusCardProps) {
  const hasErrors = errorCount > 0;
  const hasWarnings = warningCount > 0;

  let statusText: string;
  let statusClass: string;

  if (!isValidJson) {
    statusText = "Invalid JSON";
    statusClass = "neutral";
  } else if (!isValidJsonSchema) {
    statusText = "Not a Schema";
    statusClass = "neutral";
  } else if (hasErrors) {
    statusText = `${errorCount} issue${errorCount !== 1 ? "s" : ""}`;
    statusClass = "error";
  } else if (hasWarnings) {
    statusText = `${warningCount} warning${warningCount !== 1 ? "s" : ""}`;
    statusClass = "warning";
  } else {
    statusText = "Compatible";
    statusClass = "ok";
  }

  return (
    <button
      type="button"
      className={`status-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="status-card-provider">
        <ProviderIcon provider={ruleSet.providerId} />
        <span>{ruleSet.displayName}</span>
      </div>
      <div className={`status-card-status ${statusClass}`}>
        {(!isValidJson || !isValidJsonSchema) && <span>&#x2014; </span>}
        {isValidJsonSchema && hasErrors && <span>&#x2717; </span>}
        {isValidJsonSchema && !hasErrors && hasWarnings && <span>&#x26A0; </span>}
        {isValidJsonSchema && !hasErrors && !hasWarnings && <span>&#x2713; </span>}
        {statusText}
      </div>
    </button>
  );
}
