"use client";

import { useState } from "react";
import type { SchemaRuleSet, SizeLimits } from "~/types/schemaRuleSets";

function SeverityIcon({ severity }: { severity: "error" | "warning" | "info" }) {
  if (severity === "error")
    return <span className="text-[13px] font-bold text-error">&#x2715;</span>;
  if (severity === "warning")
    return <span className="text-[13px] font-bold text-warning">&#x26A0;</span>;
  return <span className="text-[13px] font-bold text-accent">&#x2139;</span>;
}

function Pill({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "supported" | "unsupported" | "default";
}) {
  const classes =
    variant === "supported"
      ? "bg-pill-supported-bg text-pill-supported-text"
      : variant === "unsupported"
        ? "bg-pill-unsupported-bg text-pill-unsupported-text"
        : "bg-surface-hover text-secondary";
  return (
    <span
      className={`inline-block rounded-sm px-1.75 py-0.5 mx-0.75 text-xs font-mono leading-4.5 whitespace-nowrap ${classes}`}
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
        className="w-full flex items-center gap-1.5 text-[10.5px] font-bold tracking-wider uppercase text-muted mt-5 mb-0 pb-1.5 border-b border-transparent hover:border-border bg-transparent border-none cursor-pointer p-0"
        style={{ borderBottomColor: open ? "var(--ds-border)" : "transparent" }}
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

function limitsToRows(
  limits: SizeLimits
): { label: string; value: string }[] {
  return Object.entries(limits)
    .filter(([key]) => key !== "notes")
    .map(([key, value]) => ({
      label: camelCaseToLabel(key),
      value: value == null ? "—" : String(value),
    }));
}

function formatBehaviorValue(val: string | boolean): "ok" | "no" | "unknown" {
  if (val === true) return "ok";
  if (val === false) return "no";
  return "unknown";
}

export function RightPane({ ruleSet }: { ruleSet: SchemaRuleSet }) {
  const modelsStr = ruleSet.models.join(", ");
  const limitsRows = limitsToRows(ruleSet.sizeLimits);
  const unknownKw =
    typeof ruleSet.behaviors.unknownKeywordsBehavior === "string"
      ? ruleSet.behaviors.unknownKeywordsBehavior
      : "—";
  const unsupportedKeywords = Object.fromEntries(
    ruleSet.supportedTypes
      .filter((st) => st.unsupportedKeywords && st.unsupportedKeywords.length > 0)
      .map((st) => [st.type, st.unsupportedKeywords!])
  );

  return (
    <div className="w-full h-full flex flex-col py-5 px-5.5 text-[13.5px] text-primary leading-[1.55] font-sans">
      <div className="shrink-0">
        <div className="text-base font-bold text-primary mb-1">
          {ruleSet.provider}&apos;s {ruleSet.displayName}
        </div>
        <Collapsible title="Description & models" defaultOpen className="mt-0">
          <div className="text-[12.5px] text-muted mb-3 leading-snug">
            {ruleSet.description}
          </div>
          <div className="text-[11.5px] text-muted font-mono leading-snug">
            {modelsStr}
          </div>
        </Collapsible>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <Collapsible title="Requirements" defaultOpen>
          <div className="flex flex-col gap-2.5">
            {ruleSet.requirements.map((c, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="mt-0.5 shrink-0">
                  <SeverityIcon severity={c.severity} />
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-primary">
                    {c.rule}
                  </div>
                  <div className="text-[11.5px] text-muted mt-0.5">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Supported Keywords" defaultOpen>
          {ruleSet.supportedTypes.map((st) => (
            <div key={st.type} className="mb-2.5">
              <div className="text-xs font-semibold text-secondary mb-1 font-mono">
                {st.type}
              </div>
              <div className="flex flex-wrap gap-0">
                {st.supportedKeywords.map((kw) => (
                  <Pill key={kw} variant="supported">
                    {kw}
                  </Pill>
                ))}
              </div>
              {ruleSet.stringFormats && ruleSet.stringFormats.length > 0 && st.type === "string" && (
                <div className="text-[11px] text-muted mt-1 ml-0.5">
                  Formats: {ruleSet.stringFormats.join(", ")}
                </div>
              )}
              {st.notes && (
                <div className="text-[11px] text-warning mt-0.5 ml-0.5 flex items-center gap-1">
                  <span className="text-[10px]">&#x26A0;</span> {st.notes}
                </div>
              )}
            </div>
          ))}
        </Collapsible>

        <Collapsible title="Unsupported Keywords">
          {Object.entries(unsupportedKeywords).map(([type, kws]) => (
            <div key={type} className="mb-2">
              <div className="text-xs font-semibold text-secondary mb-1 font-mono">
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
                <div className="text-[12.5px] text-secondary">{l.label}</div>
                <div className="text-[12.5px] font-semibold text-primary text-right font-mono">
                  {l.value}
                </div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Behaviors">
          <div className="flex flex-col gap-1">
            {Object.entries(ruleSet.behaviors)
              .filter(([k]) => k !== "unknownKeywordsBehavior")
              .map(([label, val]) => {
                const status = formatBehaviorValue(val);
                return (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-[12.5px]"
                  >
                    {status === "ok" && (
                      <span className="text-success">&#x2713;</span>
                    )}
                    {status === "no" && <span className="text-error">&#x2717;</span>}
                    {status === "unknown" && (
                      <span className="text-muted">?</span>
                    )}
                    <span
                      className={
                        status === "ok"
                          ? "text-primary"
                          : "text-muted"
                      }
                    >
                      {camelCaseToLabel(label)}
                    </span>
                    {status === "unknown" && (
                      <span className="text-[11px] text-muted">
                        (undocumented)
                      </span>
                    )}
                  </div>
                );
              })}
            <div className="text-[11.5px] text-muted mt-1">
              Unknown keywords &#x2192;{" "}
              <span className="font-mono text-[11px]">{unknownKw}</span>
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Tips">
          <div className="flex flex-col gap-1.5">
            {ruleSet.tips.map((p, i) => (
              <div
                key={i}
                className="text-xs text-secondary flex gap-2 items-start"
              >
                <span className="text-accent shrink-0 mt-0.5 text-[8px]">
                  &#x25CF;
                </span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Issues & Auto-Fix" defaultOpen className="mt-6 pt-3 border-t border-border">
          <div className="text-[12.5px] text-muted italic">
            Paste or edit a schema to see validation results.
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
