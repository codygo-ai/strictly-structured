interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  return (
    <span className="tooltip-trigger" data-tooltip={content} data-tooltip-pos={position}>
      {children}
    </span>
  );
}
