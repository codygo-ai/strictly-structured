"use client";

import type {
  StructuredOutputGroup,
  StructuredOutputGroupsMeta,
  GroupLimits,
} from "~/types/structuredOutputGroups";

function SeverityIcon({
  severity,
}: {
  severity: "error" | "warning" | "info";
}) {
  if (severity === "error")
    return <span className="text-[13px] font-bold text-[#dc3545]">✕</span>;
  if (severity === "warning")
    return <span className="text-[13px] font-bold text-[#e8a317]">⚠</span>;
  return <span className="text-[13px] font-bold text-[#5b8ad0]">ℹ</span>;
}

function Pill({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "supported" | "unsupported";
}) {
  const bg = variant === "supported" ? "#e8f5e9" : "#fce4ec";
  const color = variant === "supported" ? "#2e7d32" : "#b71c1c";
  return (
    <span
      className="inline-block px-1.75 py-0.5 mx-0.75 text-xs font-mono leading-4.5 whitespace-nowrap rounded"
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

function camelCaseToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function limitsToRows(
  limits: GroupLimits
): { label: string; value: string }[] {
  return Object.entries(limits)
    .filter(([key]) => key !== "notes")
    .map(([key, value]) => ({
      label: camelCaseToLabel(key),
      value: value == null ? "—" : String(value),
    }));
}

export function GroupCard({
  group,
  meta,
}: {
  group: StructuredOutputGroup;
  meta: StructuredOutputGroupsMeta;
}) {
  const modelsStr = group.models.join(", ");
  const limitsRows = limitsToRows(group.limits);
  const badgeClass = meta.providerBadgeClasses[group.providerId] ?? "";
  const unsupportedKeywords = Object.fromEntries(
    group.supportedTypes
      .filter((st) => st.unsupportedKeywords && st.unsupportedKeywords.length > 0)
      .map((st) => [st.type, st.unsupportedKeywords!])
  );

  return (
    <div className="bg-white border border-[#e8eaed] rounded-[10px] p-6 mb-5">
      <div className="flex justify-between items-start mb-1">
        <div className="text-[17px] font-bold text-[#1a1a1a]">
          {group.groupName}
        </div>
        <div
          className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded ${badgeClass}`}
        >
          {group.groupName}
        </div>
      </div>
      <div className="text-[13px] text-[#7a7f88] mb-2.5 leading-snug">
        {group.description}
      </div>
      <div className="text-[11.5px] text-[#aaa] mb-4 font-mono leading-snug">
        {modelsStr}
      </div>

      <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-5">
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#8a8f98] mb-2.5 pb-1 border-b border-[#eee]">
            Constraints
          </div>
          <div className="flex flex-col gap-2">
            {group.hardConstraints.map((c, i) => (
              <div key={i} className="flex gap-1.5 items-start">
                <div className="mt-0.5 shrink-0">
                  <SeverityIcon severity={c.severity} />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#333]">
                    {c.rule}
                  </div>
                  <div className="text-[10.5px] text-[#999] mt-0.5">
                    {c.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#8a8f98] mt-5 mb-2 pb-1 border-b border-[#eee]">
            Limits
          </div>
          <div className="flex flex-col gap-1">
            {limitsRows.map((l, i) => (
              <div
                key={i}
                className="flex justify-between text-xs"
              >
                <span className="text-[#666]">{l.label}</span>
                <span className="font-semibold font-mono text-[11.5px] text-[#333]">
                  {l.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#2a7d4e] mb-2.5 pb-1 border-b border-[#e8f5e9]">
            Supported Keywords
          </div>
          {group.supportedTypes.map((st) => (
            <div key={st.type} className="mb-2">
              <div className="text-[11px] font-semibold text-[#666] mb-0.5 font-mono">
                {st.type}
              </div>
              <div className="flex flex-wrap">
                {st.supportedKeywords.map((kw) => (
                  <Pill key={kw} variant="supported">
                    {kw}
                  </Pill>
                ))}
              </div>
              {st.notes && (
                <div className="text-[10px] text-[#c68a00] mt-0.5 ml-0.5">
                  ⚠ {st.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#b33] mb-2.5 pb-1 border-b border-[#fce4ec]">
            Unsupported Keywords
          </div>
          {Object.entries(unsupportedKeywords).map(([type, kws]) => (
            <div key={type} className="mb-2">
              <div className="text-[11px] font-semibold text-[#666] mb-0.5 font-mono">
                {type}
              </div>
              <div className="flex flex-wrap">
                {kws.map((kw) => (
                  <Pill key={kw} variant="unsupported">
                    {kw}
                  </Pill>
                ))}
              </div>
            </div>
          ))}
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#8a8f98] mt-4 mb-2 pb-1 border-b border-[#eee]">
            Behaviors
          </div>
          <div className="flex flex-col gap-1">
            {Object.entries(group.behaviors)
              .filter(([k]) => k !== "unknownKeywordsBehavior")
              .map(([label, val]) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-[11.5px]"
                >
                  {val === true && <span className="text-[#2a9d5c] text-[11px]">✓</span>}
                  {val === false && (
                    <span className="text-[#dc3545] text-[11px]">✗</span>
                  )}
                  {typeof val === "string" && (
                    <span className="text-[#888] text-[11px]">?</span>
                  )}
                  <span className="text-[#555]">
                    {camelCaseToLabel(label)}
                  </span>
                </div>
              ))}
            <div className="text-[10.5px] text-[#999] mt-0.5">
              Unknown kw → {String(group.behaviors.unknownKeywordsBehavior ?? "—")}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-[10px] text-[#bbb] text-right">
        Source:{" "}
        <a
          href={group.docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#888] hover:underline"
        >
          {group.docUrl.replace(/^https?:\/\//, "")}
        </a>
      </div>
    </div>
  );
}
