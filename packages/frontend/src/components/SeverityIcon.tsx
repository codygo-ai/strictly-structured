export function SeverityIcon({ severity }: { severity: "error" | "warning" | "info" }) {
  if (severity === "error")
    return <span className="text-error text-xs shrink-0">&#x2717;</span>;
  if (severity === "warning")
    return <span className="text-warning text-xs shrink-0">&#x26A0;</span>;
  return <span className="text-accent text-xs shrink-0">&#x2139;</span>;
}
