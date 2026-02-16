'use client';

import { fixSchemaForRuleSet, type FixResult } from '@ssv/schemas/ruleSetFixer';
import type { SchemaMarker } from '@ssv/schemas/ruleSetValidator';
import type { SchemaRuleSet, RuleSetId } from '@ssv/schemas/types';
import { useCallback, useState } from 'react';

import { CopyIcon } from '~/components/icons/CopyIcon';
import { DownloadIcon } from '~/components/icons/DownloadIcon';
import { SeverityIcon } from '~/components/SeverityIcon';
import { Button } from '~/components/ui';
import type { ServerValidationState } from '~/lib/providers/types';

/* ─── Types ───────────────────────────────────────────────────────────── */

export interface OtherRuleSetStatus {
  ruleSetId: RuleSetId;
  displayName: string;
  errorCount: number;
  warningCount: number;
}

interface IssuesTabProps {
  markers: SchemaMarker[];
  ruleSet: SchemaRuleSet;
  schema: string;
  isValidJsonSchema: boolean;
  onFixAll: (fixedSchema: string, fixResult: FixResult) => void;
  onScrollToLine: (line: number) => void;
  fixResult?: FixResult;
  onUndo: () => void;
  otherRuleSetStatuses: OtherRuleSetStatus[];
  lastFixedForRuleSetId?: RuleSetId;
  onSelectRuleSet: (id: RuleSetId) => void;
  serverValidation: ServerValidationState;
  onServerValidate: () => void;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };

/* ─── Local sub-components ────────────────────────────────────────────── */

function CardHeader({
  icon,
  iconVariant,
  label,
  sublabel,
}: {
  icon: string;
  iconVariant: 'error' | 'success' | 'mixed';
  label: string;
  sublabel: string;
}) {
  return (
    <div className="issues-card-header">
      <span className={`status-icon ${iconVariant}`}>{icon}</span>
      <div className="status-text">
        <div className="label">{label}</div>
        <div className="sublabel">{sublabel}</div>
      </div>
    </div>
  );
}

function CrossRuleSetBanner({
  ruleSet,
  statuses,
  onSelectRuleSet,
}: {
  ruleSet: SchemaRuleSet;
  statuses: OtherRuleSetStatus[];
  onSelectRuleSet: (id: RuleSetId) => void;
}) {
  const withIssues = statuses.filter((s) => s.errorCount > 0 || s.warningCount > 0);
  if (withIssues.length === 0) return null;

  return (
    <div className="cross-ruleset-banner">
      <span className="banner-icon">&#x26A0;</span>
      <div>
        <span className="banner-text">
          These fixes were applied for <strong>{ruleSet.displayName}</strong>. Other providers:
        </span>
        <div className="ruleset-chips">
          {statuses.map((s) => {
            const hasErrors = s.errorCount > 0;
            const hasWarnings = s.warningCount > 0;
            const variant = hasErrors ? 'error' : hasWarnings ? 'error' : 'ok';
            const label = hasErrors
              ? `\u2715 ${s.displayName} \u2014 ${s.errorCount} issue${s.errorCount !== 1 ? 's' : ''}`
              : `\u2713 ${s.displayName}`;
            return (
              <button
                key={s.ruleSetId}
                type="button"
                className={`ruleset-chip ${variant}`}
                onClick={() => onSelectRuleSet(s.ruleSetId)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ContextBanner({
  lastFixedForRuleSetId,
  currentRuleSetId,
  otherRuleSetStatuses,
}: {
  lastFixedForRuleSetId?: RuleSetId;
  currentRuleSetId: RuleSetId;
  otherRuleSetStatuses: OtherRuleSetStatus[];
}) {
  if (!lastFixedForRuleSetId || lastFixedForRuleSetId === currentRuleSetId) return null;

  // Find the display name of the rule set that was just fixed
  const fixedRuleSet = otherRuleSetStatuses.find((s) => s.ruleSetId === lastFixedForRuleSetId);
  const fixedName = fixedRuleSet?.displayName ?? lastFixedForRuleSetId;

  return (
    <div className="context-banner">
      <span>&#x2139;</span>
      <span>
        Schema was recently fixed for <strong>{fixedName}</strong>. These are provider-specific
        issues.
      </span>
    </div>
  );
}

function FixResultContent({ fixResult }: { fixResult: FixResult }) {
  return (
    <>
      <div className="fix-summary-bar">
        {fixResult.appliedFixes.length > 0 && (
          <span className="fix-summary-stat applied">
            &#x2713; {fixResult.appliedFixes.length} applied
          </span>
        )}
        {fixResult.unresolvedErrors.length > 0 && (
          <span className="fix-summary-stat unresolved">
            ! {fixResult.unresolvedErrors.length} unresolved
          </span>
        )}
      </div>

      {fixResult.appliedFixes.length > 0 && (
        <>
          <div className="fix-result-label applied">Applied</div>
          {fixResult.appliedFixes.map((fix, i) => (
            <div key={i} className="fix-result-row">
              <span className={`fix-icon ${fix.infoLost ? 'info-lost' : 'applied'}`}>
                {fix.infoLost ? '~' : '+'}
              </span>
              <span className="fix-desc">{fix.description}</span>
              {fix.infoLost && <span className="fix-note">&mdash; {fix.infoLost}</span>}
            </div>
          ))}
        </>
      )}

      {fixResult.unresolvedErrors.length > 0 && (
        <>
          <hr className="fix-divider" />
          <div className="fix-result-label unresolved">Manual fix needed</div>
          {fixResult.unresolvedErrors.map((err, i) => (
            <div key={i} className="fix-result-row">
              <span className="fix-icon unresolved">!</span>
              <span className="fix-desc">{err.message}</span>
              <span className="fix-note">&mdash; {err.reason}</span>
            </div>
          ))}
        </>
      )}
    </>
  );
}

function CompatibleContent({ ruleSet }: { ruleSet: SchemaRuleSet }) {
  return (
    <div className="compatible-hero">
      <div className="hero-icon">&#x2713;</div>
      <div className="hero-title">Ready to use</div>
      <div className="hero-subtitle">Your schema is fully compatible with this provider</div>
      <div className="model-pills">
        {ruleSet.models.map((m) => (
          <span key={m} className="model-pill">
            <span className="pill-dot" />
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function ServerValidationSection({
  ruleSet,
  serverValidation,
  onServerValidate,
}: {
  ruleSet: SchemaRuleSet;
  serverValidation: ServerValidationState;
  onServerValidate: () => void;
}) {
  const { loading, results, error } = serverValidation;

  // Determine header label
  const allOk = results?.every((r) => r.ok);
  let headerLabel = 'Verify with real API';
  if (loading) headerLabel = `Verifying with ${ruleSet.provider} API\u2026`;
  else if (results) headerLabel = 'API verification results';

  return (
    <div className="server-validate-section">
      <div className="server-validate-label">{headerLabel}</div>

      {/* Initial state: show hint + button */}
      {!loading && !results && !error && (
        <>
          <div className="server-validate-hint">
            Send this schema to {ruleSet.provider}&apos;s API to confirm it works in production.
          </div>
          <Button variant="primary" onClick={onServerValidate}>
            Validate against {ruleSet.provider}
          </Button>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div className="server-validate-loading">
          <span className="server-validate-spinner" />
          Sending schema to {ruleSet.models.length} model{ruleSet.models.length !== 1 ? 's' : ''}
          &hellip;
        </div>
      )}

      {/* Error from fetch itself */}
      {error && <div className="server-result-error">{error}</div>}

      {/* Results */}
      {results && (
        <>
          {!allOk && (
            <div className="server-validate-hint">
              Our local rules said this was compatible, but the API disagreed.
            </div>
          )}
          <div>
            {results.map((r) => (
              <div key={r.model} className="server-result-row">
                <span className="server-result-model">{r.model}</span>
                <span className={`server-result-status ${r.ok ? 'ok' : 'fail'}`}>
                  {r.ok ? 'OK' : 'Failed'}
                </span>
                <span className="server-result-latency">
                  {r.ok && r.latencyMs > 0 ? `${r.latencyMs}ms` : r.ok ? '' : '\u2014'}
                </span>
              </div>
            ))}
            {results
              .filter((r) => !r.ok && r.error)
              .map((r) => (
                <div key={`${r.model}-err`} className="server-result-error">
                  {r.model}: &ldquo;{r.error}&rdquo;
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function SchemaActions({
  copied,
  onCopy,
  onDownload,
}: {
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <>
      <span className="schema-action-label">Schema</span>
      <Button variant="ghost" onClick={onCopy}>
        <CopyIcon width={14} height={14} className="shrink-0" />
        {copied ? 'Copied!' : 'Copy'}
      </Button>
      <Button variant="ghost" onClick={onDownload}>
        <DownloadIcon width={14} height={14} className="shrink-0" />
        Download
      </Button>
    </>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */

export function IssuesTab({
  markers,
  ruleSet,
  schema,
  isValidJsonSchema,
  onFixAll,
  onScrollToLine,
  fixResult,
  onUndo,
  otherRuleSetStatuses,
  lastFixedForRuleSetId,
  onSelectRuleSet,
  serverValidation,
  onServerValidate,
}: IssuesTabProps) {
  const [error, setError] = useState<string>();
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
    const blob = new Blob([schema], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [schema]);

  const sorted = [...markers].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
  );

  const fixableCount = markers.filter(
    (m) => m.severity === 'error' || m.severity === 'warning',
  ).length;

  const handleFixAll = useCallback(() => {
    setError(undefined);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(schema) as Record<string, unknown>;
    } catch {
      setError('Schema is not valid JSON');
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

  /* ── State B: Post-fix results ── */
  if (fixResult) {
    const allResolved = fixResult.unresolvedErrors.length === 0;
    const noneResolved = fixResult.appliedFixes.length === 0;
    const iconVariant = allResolved ? 'success' : noneResolved ? 'error' : 'mixed';
    const icon = allResolved ? '\u2713' : noneResolved ? '!' : '\u2713';
    const label = allResolved ? 'All issues fixed' : `Fixes applied`;
    const sublabel = allResolved
      ? `${fixResult.appliedFixes.length} fix${fixResult.appliedFixes.length !== 1 ? 'es' : ''} applied for ${ruleSet.displayName}`
      : `${fixResult.appliedFixes.length} fixed \u00B7 ${fixResult.unresolvedErrors.length} needs manual fix`;

    return (
      <div className="issues-card">
        <CardHeader icon={icon} iconVariant={iconVariant} label={label} sublabel={sublabel} />
        <div className="issues-card-content">
          <CrossRuleSetBanner
            ruleSet={ruleSet}
            statuses={otherRuleSetStatuses}
            onSelectRuleSet={onSelectRuleSet}
          />
          <FixResultContent fixResult={fixResult} />
        </div>
        <div className="issues-card-footer">
          <Button variant="ghost" onClick={onUndo}>
            Undo
          </Button>
          <div className="footer-spacer" />
          <SchemaActions copied={copied} onCopy={handleCopy} onDownload={handleDownload} />
        </div>
      </div>
    );
  }

  /* ── State C: Compatible (no issues) ── */
  if (sorted.length === 0) {
    return (
      <div className="issues-card">
        <CardHeader
          icon={'\u2713'}
          iconVariant="success"
          label="Compatible"
          sublabel={ruleSet.displayName}
        />
        <div className="issues-card-content">
          <ContextBanner
            lastFixedForRuleSetId={lastFixedForRuleSetId}
            currentRuleSetId={ruleSet.ruleSetId}
            otherRuleSetStatuses={otherRuleSetStatuses}
          />
          <CompatibleContent ruleSet={ruleSet} />
        </div>
        <ServerValidationSection
          ruleSet={ruleSet}
          serverValidation={serverValidation}
          onServerValidate={onServerValidate}
        />
        <div className="issues-card-footer">
          <SchemaActions copied={copied} onCopy={handleCopy} onDownload={handleDownload} />
        </div>
      </div>
    );
  }

  /* ── State A: Issues found ── */
  return (
    <div className="issues-card">
      <CardHeader
        icon={'\u2715'}
        iconVariant="error"
        label={`${sorted.length} issue${sorted.length !== 1 ? 's' : ''} found`}
        sublabel={ruleSet.displayName}
      />
      <div className="issues-card-content">
        <ContextBanner
          lastFixedForRuleSetId={lastFixedForRuleSetId}
          currentRuleSetId={ruleSet.ruleSetId}
          otherRuleSetStatuses={otherRuleSetStatuses}
        />
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
      </div>
      {isValidJsonSchema && fixableCount > 0 && (
        <div className="issues-card-footer">
          <Button variant="primary" onClick={handleFixAll}>
            Fix all {fixableCount} issue{fixableCount !== 1 ? 's' : ''}
          </Button>
          {error && <span className="text-xs text-error">{error}</span>}
        </div>
      )}
    </div>
  );
}
