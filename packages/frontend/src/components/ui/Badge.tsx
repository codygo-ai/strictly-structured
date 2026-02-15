import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant: "success" | "error" | "warning" | "info" | "neutral";
}

export function Badge({ children, variant }: BadgeProps) {
  return (
    <span
      className={clsx(
        "rounded px-2 py-0.5 text-xs font-medium",
        variant === "success" && "bg-success/20 text-success",
        variant === "error" && "bg-error/20 text-error",
        variant === "warning" && "bg-warning/20 text-warning",
        variant === "info" && "bg-accent/20 text-accent",
        variant === "neutral" && "bg-surface-hover text-secondary",
      )}
    >
      {children}
    </span>
  );
}
