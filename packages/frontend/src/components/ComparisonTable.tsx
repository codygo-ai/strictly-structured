"use client";

import type {
  ComparisonColumn,
  ComparisonLegend,
  ComparisonRow,
  ProviderId,
  SchemaRuleSet,
} from "@ssv/schemas/types";
import { ProviderIcon } from "~/components/ui";

const TABLE_ICON_SIZE = 18;

function cellStyle(ok: boolean | "warn" | "partial"): {
  color: string;
  background: string;
} {
  if (ok === true) return { color: "var(--ds-cell-ok-text)", background: "var(--ds-cell-ok-bg)" };
  if (ok === false) return { color: "var(--ds-cell-fail-text)", background: "var(--ds-cell-fail-bg)" };
  return { color: "var(--ds-cell-warn-text)", background: "var(--ds-cell-warn-bg)" };
}

function columnLabel(columnId: ProviderId, ruleSets: SchemaRuleSet[]): string {
  return ruleSets.find((r) => r.providerId === columnId)?.displayName ?? columnId;
}

export function ComparisonTable({
  columns,
  rows,
  legend,
  ruleSets,
}: {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  legend: ComparisonLegend;
  ruleSets: SchemaRuleSet[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-2.5 px-3 font-semibold text-secondary text-xs">
              Feature
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                className="text-center py-2.5 px-3 font-bold text-primary text-xs"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ProviderIcon provider={col.id} size={TABLE_ICON_SIZE} className="shrink-0 inline-block align-middle" />
                  {columnLabel(col.id, ruleSets)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border"
              style={{
                background: i % 2 === 0 ? "var(--ds-surface)" : "var(--ds-row-alt)",
              }}
            >
              <td className="py-2 px-3 text-secondary font-medium text-[12.5px]">
                {row.feature}
              </td>
              {columns.map((col) => {
                const val = row[col.id];
                const ok = row[`${col.id}Ok`];
                const style = cellStyle(ok);
                return (
                  <td
                    key={col.id}
                    className="py-2 px-3 text-center font-mono text-xs"
                    style={{ color: style.color, background: style.background }}
                  >
                    {String(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-[11px] text-muted mt-2 flex gap-4">
        <span>
          <span className="text-cell-ok-text">&#x2713;</span> = {legend.supported}
        </span>
        <span>
          <span className="text-cell-fail-text">&#x2717;</span> = {legend.unsupported}
        </span>
        <span>
          <span className="text-cell-warn-text">~</span> = {legend.limited}
        </span>
        <span>* = {legend.notOnFinetuned}</span>
      </div>
    </div>
  );
}
