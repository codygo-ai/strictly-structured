"use client";

import { useState, useMemo } from "react";
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
  { id: "server-test", label: "Server Test" },
  { id: "reference", label: "Reference" },
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

  const selectedRuleSet = useMemo(
    () => ruleSets.find((r) => r.ruleSetId === selectedRuleSetId),
    [ruleSets, selectedRuleSetId],
  );

  const selectedSummary = validationResults.get(selectedRuleSetId);

  return (
    <aside className="sidebar">
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
              <span className="ml-1 text-error">
                ({selectedSummary.errorCount})
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
                onFixAll={onFixAll}
                onScrollToLine={onScrollToLine}
                fixResult={fixResult}
              />
            )}
            {activeTab === "server-test" && (
              <ServerTestTab schema={schema} ruleSet={selectedRuleSet} />
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
