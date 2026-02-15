export function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "error")
    return <span className="text-error font-bold text-xs shrink-0">&#x2717;</span>;
  if (severity === "warning")
    return <span className="text-warning font-bold text-xs shrink-0">&#x26A0;</span>;
  return <span className="text-accent font-bold text-xs shrink-0">&#x2139;</span>;
}
