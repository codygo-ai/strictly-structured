"use client";

import type { UniversalRules as UniversalRulesType } from "~/types/structuredOutputGroups";

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

export function UniversalRules({ data }: { data: UniversalRulesType }) {
  return (
    <div className="bg-[#f8f9fb] border border-[#e8eaed] rounded-[10px] p-6">
      <div className="text-[15px] font-bold text-[#1a1a1a] mb-3.5">
        Universal Rules — All Providers
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#2a7d4e] mb-2">
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
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#b33] mb-2">
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
