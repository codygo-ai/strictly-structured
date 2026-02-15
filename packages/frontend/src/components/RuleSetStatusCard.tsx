"use client";

import type { SchemaRuleSet, ProviderId } from "~/types/schemaRuleSets";
import { OpenAIIcon } from "~/components/icons/OpenAIIcon";
import { ClaudeIcon } from "~/components/icons/ClaudeIcon";
import { GeminiIcon } from "~/components/icons/GeminiIcon";

function ProviderIcon({ provider }: { provider: ProviderId }) {
  const size = 16;
  const className = "shrink-0";
  switch (provider) {
    case "openai":
      return <OpenAIIcon className={className} width={size} height={size} />;
    case "anthropic":
      return <ClaudeIcon className={className} width={size} height={size} />;
    case "gemini":
      return <GeminiIcon className={className} width={size} height={size} />;
    default:
      return null;
  }
}

interface RuleSetStatusCardProps {
  ruleSet: SchemaRuleSet;
  errorCount: number;
  warningCount: number;
  isValidJson: boolean;
  selected: boolean;
  onClick: () => void;
}

export function RuleSetStatusCard({
  ruleSet,
  errorCount,
  warningCount,
  isValidJson,
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
      className={`status-card ${selected ? "selected" : ""} status-${statusClass}`}
      onClick={onClick}
    >
      <div className="status-card-header">
        <ProviderIcon provider={ruleSet.providerId} />
        <span>{ruleSet.displayName}</span>
      </div>
      <div className={`status-card-status ${statusClass}`}>
        {!isValidJson && <span>&#x2014; </span>}
        {isValidJson && hasErrors && <span>&#x2717; </span>}
        {isValidJson && !hasErrors && hasWarnings && <span>&#x26A0; </span>}
        {isValidJson && !hasErrors && !hasWarnings && <span>&#x2713; </span>}
        {statusText}
      </div>
    </button>
  );
}
