"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import type { SchemaRuleSet } from "~/types/schemaRuleSets";
import type { RuleSetValidationSummary } from "~/hooks/useAllRuleSetsValidation";
import type { FixResult } from "~/lib/schemaFixer";
import { RuleSetStatusCard } from "~/components/RuleSetStatusCard";
import { IssuesTab } from "~/components/IssuesTab";
import { ServerTestTab } from "~/components/ServerTestTab";
import { ReferenceTab } from "~/components/ReferenceTab";

type TabId = "issues" | "server-test" | "reference";

interface CompatibilityDashboardProps {
  ruleSets: SchemaRuleSet[];
  validationResults: Map<string, RuleSetValidationSummary>;
  selectedRuleSetId: string;
  onSelectRuleSet: (id: string) => void;
  schema: string;
  onFixAll: (fixedSchema: string, fixResult: FixResult) => void;
  onScrollToLine: (line: number) => void;
  fixResult: FixResult | null;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "issues", label: "Issues" },
  { id: "reference", label: "Reference" },
  { id: "server-test", label: "Server Test" },
];

export function CompatibilityDashboard({
  ruleSets,
  validationResults,
  selectedRuleSetId,
  onSelectRuleSet,
  schema,
  onFixAll,
  onScrollToLine,
  fixResult,
}: CompatibilityDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("issues");
  const sidebarRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const startX = e.clientX;
    const startWidth = sidebar.getBoundingClientRect().width;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const delta = startX - ev.clientX;
      const minWidth = 420;
      setWidth(Math.max(minWidth, startWidth + delta));
    };

    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  }, []);

  const selectedRuleSet = useMemo(
    () => ruleSets.find((r) => r.ruleSetId === selectedRuleSetId),
    [ruleSets, selectedRuleSetId],
  );

  const selectedSummary = validationResults.get(selectedRuleSetId);

  return (
    <aside
      ref={sidebarRef}
      className="sidebar"
      style={width ? { width } : undefined}
    >
      {/* Resize grip */}
      <div
        className="sidebar-resize-handle"
        onPointerDown={handlePointerDown}
      />
      {/* Status cards */}
      <div className="status-cards">
        {ruleSets.map((rs) => {
          const summary = validationResults.get(rs.ruleSetId);
          return (
            <RuleSetStatusCard
              key={rs.ruleSetId}
              ruleSet={rs}
              errorCount={summary?.errorCount ?? 0}
              warningCount={summary?.warningCount ?? 0}
              isValidJson={summary?.isValidJson ?? true}
              isValidJsonSchema={summary?.isValidJsonSchema ?? true}
              selected={rs.ruleSetId === selectedRuleSetId}
              onClick={() => onSelectRuleSet(rs.ruleSetId)}
            />
          );
        })}
      </div>

      {/* Tab bar */}
      <div className="dashboard-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`dashboard-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "issues" && selectedSummary && selectedSummary.errorCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-error/15 text-error text-[0.65rem] font-semibold px-1">
                {selectedSummary.errorCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="dashboard-tab-content">
        {selectedRuleSet ? (
          <>
            {activeTab === "issues" && (
              <IssuesTab
                markers={selectedSummary?.markers ?? []}
                ruleSet={selectedRuleSet}
                schema={schema}
                isValidJsonSchema={selectedSummary?.isValidJsonSchema ?? true}
                onFixAll={onFixAll}
                onScrollToLine={onScrollToLine}
                fixResult={fixResult}
              />
            )}
            {activeTab === "server-test" && (
              <ServerTestTab
                schema={schema}
                ruleSet={selectedRuleSet}
                isValidJsonSchema={selectedSummary?.isValidJsonSchema ?? true}
              />
            )}
            {activeTab === "reference" && (
              <ReferenceTab ruleSet={selectedRuleSet} />
            )}
          </>
        ) : (
          <p className="text-xs text-muted italic">Select a rule set above.</p>
        )}
      </div>
    </aside>
  );
}
