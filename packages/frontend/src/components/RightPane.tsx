"use client";

import { useState } from "react";
import type { StructuredOutputGroup } from "~/types/structuredOutputGroups";

function SeverityIcon({ severity }: { severity: "error" | "warning" | "info" }) {
  if (severity === "error")
    return <span className="text-[13px] font-bold text-[#dc3545]">✕</span>;
  if (severity === "warning")
    return <span className="text-[13px] font-bold text-[#e8a317]">⚠</span>;
  return <span className="text-[13px] font-bold text-[#5b8ad0]">ℹ</span>;
}

function Pill({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "supported" | "unsupported" | "default";
}) {
  const bg =
    variant === "supported"
      ? "#e8f5e9"
      : variant === "unsupported"
        ? "#fce4ec"
        : "#f0f1f3";
  const color =
    variant === "supported"
      ? "#2e7d32"
      : variant === "unsupported"
        ? "#b71c1c"
        : "#444";
  return (
    <span
      className="inline-block px-[7px] py-0.5 mx-[3px] text-xs font-mono leading-[18px] whitespace-nowrap"
      style={{ borderRadius: 4, background: bg, color }}
    >
      {children}
    </span>
  );
}

function Collapsible({
  title,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 text-[10.5px] font-bold tracking-wider uppercase text-[#8a8f98] mt-5 mb-0 pb-1.5 border-b border-transparent hover:border-[#ebedf0] bg-transparent border-none cursor-pointer p-0"
        style={{ borderBottomColor: open ? "#ebedf0" : "transparent" }}
      >
        <span
          className="inline-block text-[9px] transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        {title}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function camelCaseToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function quantitativeLimitsToRows(
  limits: Record<string, number | string | null | undefined>
): { label: string; value: string }[] {
  return Object.entries(limits).map(([key, value]) => ({
    label: camelCaseToLabel(key),
    value: value == null ? "—" : String(value),
  }));
}

function formatBehaviorValue(val: string | boolean): "ok" | "no" | "unknown" {
  if (val === true) return "ok";
  if (val === false) return "no";
  return "unknown";
}

export function RightPane({ group }: { group: StructuredOutputGroup }) {
  const d = group.display;
  const modelsStr = group.models.join(", ");
  const limitsRows = quantitativeLimitsToRows(d.quantitativeLimits);
  const unknownKw =
    typeof d.behaviors.unknownKeywordsBehavior === "string"
      ? d.behaviors.unknownKeywordsBehavior
      : "—";

  return (
    <div className="w-full h-full flex flex-col py-5 px-[22px] text-[13.5px] text-[#2c2c2c] leading-[1.55] font-sans">
      <div className="shrink-0">
        <div className="text-base font-bold text-[#1a1a1a] mb-1">
          {group.provider}&apos;s {group.groupName}
        </div>
        <Collapsible title="Description & models" defaultOpen className="mt-0">
          <div className="text-[12.5px] text-[#7a7f88] mb-3 leading-snug">
            {group.description}
          </div>
          <div className="text-[11.5px] text-[#999] font-mono leading-snug">
            {modelsStr}
          </div>
        </Collapsible>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <Collapsible title="Hard Constraints" defaultOpen>
          <div className="flex flex-col gap-2.5">
            {d.hardConstraints.map((c, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="mt-0.5 shrink-0">
                  <SeverityIcon severity={c.severity} />
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-[#1a1a1a]">
                    {c.rule}
                  </div>
                  <div className="text-[11.5px] text-[#888] mt-0.5">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Supported Keywords" defaultOpen>
          {d.supportedTypes.map((st) => (
            <div key={st.type} className="mb-2.5">
              <div className="text-xs font-semibold text-[#555] mb-1 font-mono">
                {st.type}
              </div>
              <div className="flex flex-wrap gap-0">
                {st.supportedKeywords.map((kw) => (
                  <Pill key={kw} variant="supported">
                    {kw}
                  </Pill>
                ))}
              </div>
              {d.stringFormats && d.stringFormats.length > 0 && st.type === "string" && (
                <div className="text-[11px] text-[#888] mt-1 ml-0.5">
                  Formats: {d.stringFormats.join(", ")}
                </div>
              )}
              {st.notes && (
                <div className="text-[11px] text-[#c68a00] mt-0.5 ml-0.5 flex items-center gap-1">
                  <span className="text-[10px]">⚠</span> {st.notes}
                </div>
              )}
            </div>
          ))}
        </Collapsible>

        <Collapsible title="Unsupported Keywords">
          {Object.entries(d.unsupportedKeywords).map(([type, kws]) => (
            <div key={type} className="mb-2">
              <div className="text-xs font-semibold text-[#555] mb-1 font-mono">
                {type}
              </div>
              <div className="flex flex-wrap gap-0">
                {kws.map((kw) => (
                  <Pill key={kw} variant="unsupported">
                    {kw}
                  </Pill>
                ))}
              </div>
            </div>
          ))}
        </Collapsible>

        <Collapsible title="Quantitative Limits">
          <div className="grid gap-1.5 gap-x-4 grid-cols-[1fr_auto]">
            {limitsRows.map((l, i) => (
              <div key={i} className="contents">
                <div className="text-[12.5px] text-[#555]">{l.label}</div>
                <div className="text-[12.5px] font-semibold text-[#1a1a1a] text-right font-mono">
                  {l.value}
                </div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Behaviors">
          <div className="flex flex-col gap-1">
            {Object.entries(d.behaviors)
              .filter(([k]) => k !== "unknownKeywordsBehavior")
              .map(([label, val]) => {
                const status = formatBehaviorValue(val);
                return (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-[12.5px]"
                  >
                    {status === "ok" && (
                      <span className="text-[#2a9d5c]">✓</span>
                    )}
                    {status === "no" && <span className="text-[#dc3545]">✗</span>}
                    {status === "unknown" && (
                      <span className="text-[#888]">?</span>
                    )}
                    <span
                      className={
                        status === "ok"
                          ? "text-[#333]"
                          : status === "no"
                            ? "text-[#999]"
                            : "text-[#888]"
                      }
                    >
                      {camelCaseToLabel(label)}
                    </span>
                    {status === "unknown" && (
                      <span className="text-[11px] text-[#aaa]">
                        (undocumented)
                      </span>
                    )}
                  </div>
                );
              })}
            <div className="text-[11.5px] text-[#888] mt-1">
              Unknown keywords →{" "}
              <span className="font-mono text-[11px]">{unknownKw}</span>
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Best Practices">
          <div className="flex flex-col gap-1.5">
            {d.bestPractices.map((p, i) => (
              <div
                key={i}
                className="text-xs text-[#555] flex gap-2 items-start"
              >
                <span className="text-[#5b8ad0] shrink-0 mt-0.5 text-[8px]">
                  ●
                </span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Issues & Auto-Fix" defaultOpen className="mt-6 pt-3 border-t border-[#ebedf0]">
          <div className="text-[12.5px] text-[#888] italic">
            Paste or edit a schema to see validation results.
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
