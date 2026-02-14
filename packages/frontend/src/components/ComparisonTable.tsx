"use client";

import {
  OpenAIIcon,
  ClaudeIcon,
  GeminiIcon,
} from "~/components/icons";
import type {
  ComparisonColumn,
  ComparisonLegend,
  ComparisonRow,
  ProviderId,
  StructuredOutputGroup,
} from "~/types/structuredOutputGroups";

const TABLE_ICON_SIZE = 18;

function ProviderIcon({ providerId }: { providerId: ProviderId }) {
  const className = "shrink-0 inline-block align-middle";
  switch (providerId) {
    case "openai":
      return (
        <OpenAIIcon
          className={className}
          width={TABLE_ICON_SIZE}
          height={TABLE_ICON_SIZE}
        />
      );
    case "anthropic":
      return (
        <ClaudeIcon
          className={className}
          width={TABLE_ICON_SIZE}
          height={TABLE_ICON_SIZE}
        />
      );
    case "gemini":
      return (
        <GeminiIcon
          className={className}
          width={TABLE_ICON_SIZE}
          height={TABLE_ICON_SIZE}
        />
      );
    default:
      return null;
  }
}

function cellStyle(ok: boolean | "warn" | "partial"): {
  color: string;
  background: string;
} {
  if (ok === true) return { color: "#2a7d4e", background: "#f0faf4" };
  if (ok === false) return { color: "#b33", background: "#fef5f5" };
  return { color: "#9a6c00", background: "#fefbf0" };
}

function columnLabel(columnId: ProviderId, groups: StructuredOutputGroup[]): string {
  return groups.find((g) => g.provider_id === columnId)?.short_name ?? columnId;
}

export function ComparisonTable({
  columns,
  rows,
  legend,
  groups,
}: {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  legend: ComparisonLegend;
  groups: StructuredOutputGroup[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b-2 border-[#e0e0e0]">
            <th className="text-left py-2.5 px-3 font-semibold text-[#555] text-xs">
              Feature
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                className="text-center py-2.5 px-3 font-bold text-[#1a1a1a] text-xs"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ProviderIcon providerId={col.id} />
                  {columnLabel(col.id, groups)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[#f0f0f0]"
              style={{
                background: i % 2 === 0 ? "#fff" : "#fafbfc",
              }}
            >
              <td className="py-2 px-3 text-[#444] font-medium text-[12.5px]">
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
      <div className="text-[11px] text-[#aaa] mt-2 flex gap-4">
        <span>
          <span style={{ color: "#2a7d4e" }}>✓</span> = {legend.supported}
        </span>
        <span>
          <span style={{ color: "#b33" }}>✗</span> = {legend.unsupported}
        </span>
        <span>
          <span style={{ color: "#9a6c00" }}>~</span> = {legend.limited}
        </span>
        <span>* = {legend.not_on_finetuned}</span>
      </div>
    </div>
  );
}
