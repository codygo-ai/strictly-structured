"use client";

import Link from "next/link";
import type {
  SchemaRuleSet,
  SchemaRuleSetsMeta,
} from "~/types/schemaRuleSets";
import { SeverityIcon } from "~/components/SeverityIcon";
import { Pill } from "~/components/ui";
import { camelCaseToLabel, limitsToRows } from "~/lib/format";

export function RuleSetCard({
  ruleSet,
  meta,
}: {
  ruleSet: SchemaRuleSet;
  meta: SchemaRuleSetsMeta;
}) {
  const modelsStr = ruleSet.models.join(", ");
  const limitsRows = limitsToRows(ruleSet.sizeLimits);
  const badgeClass = meta.providerBadgeClasses[ruleSet.providerId] ?? "";
  const unsupportedKeywords = Object.fromEntries(
    ruleSet.supportedTypes
      .filter((st) => st.unsupportedKeywords && st.unsupportedKeywords.length > 0)
      .map((st) => [st.type, st.unsupportedKeywords!])
  );

  return (
    <div className="bg-surface border border-border rounded-[10px] p-6 mb-5">
      <div className="flex justify-between items-start mb-1">
        <div className="text-[17px] font-bold text-primary">
          {ruleSet.displayName}
        </div>
        <div
          className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded ${badgeClass}`}
        >
          {ruleSet.displayName}
        </div>
      </div>
      <div className="text-[13px] text-secondary mb-2.5 leading-snug">
        {ruleSet.description}
      </div>
      <div className="text-[11.5px] text-muted mb-4 font-mono leading-snug">
        {modelsStr}
      </div>

      <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-5">
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-muted mb-2.5 pb-1 border-b border-border">
            Constraints
          </div>
          <div className="flex flex-col gap-2">
            {ruleSet.requirements.map((c, i) => (
              <div key={i} className="flex gap-1.5 items-start">
                <div className="mt-0.5 shrink-0">
                  <SeverityIcon severity={c.severity} className="text-[13px] font-bold" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-primary">
                    {c.rule}
                  </div>
                  <div className="text-[10.5px] text-muted mt-0.5">
                    {c.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-muted mt-5 mb-2 pb-1 border-b border-border">
            Limits
          </div>
          <div className="flex flex-col gap-1">
            {limitsRows.map((l, i) => (
              <div
                key={i}
                className="flex justify-between text-xs"
              >
                <span className="text-secondary">{l.label}</span>
                <span className="font-semibold font-mono text-[11.5px] text-primary">
                  {l.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-heading-supported mb-2.5 pb-1 border-b border-pill-supported-bg">
            Supported Keywords
          </div>
          {ruleSet.supportedTypes.map((st) => (
            <div key={st.type} className="mb-2">
              <div className="text-[11px] font-semibold text-secondary mb-0.5 font-mono">
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
                <div className="text-[10px] text-warning mt-0.5 ml-0.5">
                  ⚠ {st.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-heading-unsupported mb-2.5 pb-1 border-b border-pill-unsupported-bg">
            Unsupported Keywords
          </div>
          {Object.entries(unsupportedKeywords).map(([type, kws]) => (
            <div key={type} className="mb-2">
              <div className="text-[11px] font-semibold text-secondary mb-0.5 font-mono">
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
          <div className="text-[10px] font-bold tracking-wider uppercase text-muted mt-4 mb-2 pb-1 border-b border-border">
            Behaviors
          </div>
          <div className="flex flex-col gap-1">
            {Object.entries(ruleSet.behaviors)
              .filter(([k]) => k !== "unknownKeywordsBehavior")
              .map(([label, val]) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-[11.5px]"
                >
                  {val === true && <span className="text-success text-[11px]">✓</span>}
                  {val === false && (
                    <span className="text-error text-[11px]">✗</span>
                  )}
                  {typeof val === "string" && (
                    <span className="text-muted text-[11px]">?</span>
                  )}
                  <span className="text-secondary">
                    {camelCaseToLabel(label)}
                  </span>
                </div>
              ))}
            <div className="text-[10.5px] text-muted mt-0.5">
              Unknown kw → {String(ruleSet.behaviors.unknownKeywordsBehavior ?? "—")}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="text-[10px] text-muted">
          Source:{" "}
          <a
            href={ruleSet.docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline"
          >
            {ruleSet.docUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <Link
          href={`/?ruleSet=${ruleSet.ruleSetId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
        >
          Try in validator
        </Link>
      </div>
    </div>
  );
}
