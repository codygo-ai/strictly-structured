import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "toolbar" | "ghost";
  active?: boolean;
}

export function Button({
  variant = "primary",
  active,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={clsx(
        "inline-flex items-center cursor-pointer",
        variant === "primary" && [
          "gap-2 px-4 py-2 text-[0.8rem] font-semibold text-white bg-accent border-none rounded-md",
          "[box-shadow:var(--ds-shadow-button)]",
          "hover:bg-accent-hover hover:[box-shadow:var(--ds-shadow-button-hover)]",
          "transition-[background-color,box-shadow] duration-200",
        ],
        variant === "toolbar" && [
          "gap-1.5 px-2.5 py-1.5 text-xs font-medium text-secondary bg-surface border border-border rounded-sm",
          "hover:text-primary hover:bg-surface-hover hover:border-accent",
          "transition-[background-color,color,border-color] duration-200",
          active && "text-success border-success",
        ],
        variant === "ghost" && [
          "gap-1.5 text-xs text-muted hover:text-primary",
          "bg-transparent border-none p-0 transition-colors",
        ],
        className,
      )}
    />
  );
}
