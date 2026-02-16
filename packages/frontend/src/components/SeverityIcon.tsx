import clsx from 'clsx';

interface SeverityIconProps {
  severity: 'error' | 'warning' | 'info';
  className?: string;
}

export function SeverityIcon({ severity, className }: SeverityIconProps) {
  const base = className ?? 'text-xs shrink-0';
  if (severity === 'error') return <span className={clsx(base, 'text-error')}>&#x2717;</span>;
  if (severity === 'warning') return <span className={clsx(base, 'text-warning')}>&#x26A0;</span>;
  return <span className={clsx(base, 'text-accent')}>&#x2139;</span>;
}
