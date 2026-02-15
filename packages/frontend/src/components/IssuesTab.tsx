"use client";

import { useCallback, useState } from "react";
import type { SchemaRuleSet } from "~/types/schemaRuleSets";
import type { SchemaMarker } from "~/lib/ruleSetValidator";
import { fixSchemaForRuleSet, type FixResult } from "~/lib/schemaFixer";
import { SeverityIcon } from "~/components/SeverityIcon";
import { Button } from "~/components/ui";
import { CopyIcon } from "~/components/icons/CopyIcon";
import { DownloadIcon } from "~/components/icons/DownloadIcon";

interface IssuesTabProps {
  markers: SchemaMarker[];
  ruleSet: SchemaRuleSet;
  schema: string;
  isValidJsonSchema: boolean;
  onFixAll: (fixedSchema: string, fixResult: FixResult) => void;
  onScrollToLine: (line: number) => void;
  fixResult: FixResult | null;
}

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };

export function IssuesTab({
  markers,
  ruleSet,
  schema,
  isValidJsonSchema,
  onFixAll,
  onScrollToLine,
  fixResult,
}: IssuesTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(schema);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
  }, [schema]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([schema], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [schema]);

  const sorted = [...markers].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
  );

  const fixableCount = markers.filter((m) => m.severity === "error" || m.severity === "warning").length;

  const handleFixAll = useCallback(() => {
    setError(null);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(schema) as Record<string, unknown>;
    } catch {
      setError("Schema is not valid JSON");
      return;
    }

    const result = fixSchemaForRuleSet(parsed, ruleSet);

    if (result.appliedFixes.length === 0 && result.unresolvedErrors.length === 0) {
      return;
    }

    if (result.appliedFixes.length > 0) {
      onFixAll(JSON.stringify(result.fixedSchema, null, 2), result);
    } else {
      onFixAll(schema, result);
    }
  }, [schema, ruleSet, onFixAll]);

  // After a fix has been applied, show the results
  if (fixResult) {
    return (
      <div className="space-y-3 rounded-md bg-surface-subtle p-3 border border-border">
        {fixResult.appliedFixes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-success mb-1.5">
              Applied {fixResult.appliedFixes.length} fix{fixResult.appliedFixes.length !== 1 ? "es" : ""}
            </p>
            <div className="space-y-1">
              {fixResult.appliedFixes.map((fix, i) => (
                <div key={i} className="flex gap-2 items-start text-xs">
                  <span className={fix.infoLost ? "text-warning" : "text-success"}>
                    {fix.infoLost ? "~" : "+"}
                  </span>
                  <span className="text-secondary">{fix.description}</span>
                  {fix.infoLost && (
                    <span className="text-muted italic">&mdash; {fix.infoLost}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {fixResult.unresolvedErrors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-error mb-1.5">
              {fixResult.unresolvedErrors.length} unresolved
            </p>
            <div className="space-y-1">
              {fixResult.unresolvedErrors.map((err, i) => (
                <div key={i} className="flex gap-2 items-start text-xs">
                  <span className="text-error">!</span>
                  <span className="text-secondary">{err.message}</span>
                  <span className="text-muted italic">&mdash; {err.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <Button variant="ghost" onClick={handleCopy}>
            <CopyIcon width={14} height={14} className="shrink-0" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="ghost" onClick={handleDownload}>
            <DownloadIcon width={14} height={14} className="shrink-0" />
            Download
          </Button>
        </div>
      </div>
    );
  }

  // No markers
  if (sorted.length === 0) {
    return (
      <div className="rounded-md bg-surface-subtle p-3 border border-border">
        <div className="flex flex-col items-center justify-center pt-10 text-center">
          <span className="text-success text-2xl mb-2">&#x2713;</span>
          <p className="text-sm text-secondary font-medium">Compatible with {ruleSet.displayName}</p>
          <p className="text-xs text-muted mt-1">No issues found</p>
          <p className="text-xs  text-start text-muted mt-20 mb-2">
            You can safely use this schema with{" "}
            {ruleSet.models.map((m, i) => (
              <span key={m}>
                {i > 0 && (i === ruleSet.models.length - 1 ? " and " : ", ")}
                <span className="font-medium text-secondary">{m}</span>
              </span>
            ))}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <Button variant="ghost" onClick={handleCopy}>
            <CopyIcon width={14} height={14} className="shrink-0" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="ghost" onClick={handleDownload}>
            <DownloadIcon width={14} height={14} className="shrink-0" />
            Download
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {sorted.map((marker, i) => (
        <div key={i} className="issue-row">
          <SeverityIcon severity={marker.severity} />
          <button
            type="button"
            className="issue-line"
            onClick={() => onScrollToLine(marker.startLineNumber)}
          >
            L{marker.startLineNumber}
          </button>
          <span className="issue-message">{marker.message}</span>
        </div>
      ))}

      {isValidJsonSchema && fixableCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <Button variant="primary" onClick={handleFixAll}>
            Fix all {fixableCount} issue{fixableCount !== 1 ? "s" : ""}
          </Button>
          {error && (
            <p className="text-xs text-error mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
