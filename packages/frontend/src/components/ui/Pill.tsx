import clsx from "clsx";

interface PillProps {
  children: React.ReactNode;
  variant?: "supported" | "unsupported" | "default";
}

export function Pill({ children, variant = "default" }: PillProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded px-1.75 py-0.5 mx-0.75 text-xs font-mono leading-4.5 whitespace-nowrap",
        variant === "supported" && "bg-pill-supported-bg text-pill-supported-text",
        variant === "unsupported" && "bg-pill-unsupported-bg text-pill-unsupported-text",
        variant === "default" && "bg-surface-hover text-secondary",
      )}
    >
      {children}
    </span>
  );
}
