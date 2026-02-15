"use client";

import type { UniversalRules as UniversalRulesType } from "~/types/schemaRuleSets";

function Pill({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "supported" | "unsupported";
}) {
  const classes =
    variant === "supported"
      ? "bg-pill-supported-bg text-pill-supported-text"
      : "bg-pill-unsupported-bg text-pill-unsupported-text";
  return (
    <span
      className={`inline-block rounded px-1.75 py-0.5 mx-0.75 text-xs font-mono leading-4.5 whitespace-nowrap ${classes}`}
    >
      {children}
    </span>
  );
}

export function UniversalRules({ data }: { data: UniversalRulesType }) {
  return (
    <div className="bg-surface-subtle border border-border rounded-[10px] p-6">
      <div className="text-[15px] font-bold text-primary mb-3.5">
        Universal Rules — All Providers
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-heading-supported mb-2">
            Always Supported
          </div>
          <div className="flex flex-wrap">
            {data.alwaysSupported.map((kw) => (
              <Pill key={kw} variant="supported">
                {kw}
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-heading-unsupported mb-2">
            Never Supported
          </div>
          <div className="flex flex-wrap">
            {data.neverSupported.map((kw) => (
              <Pill key={kw} variant="unsupported">
                {kw}
              </Pill>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
