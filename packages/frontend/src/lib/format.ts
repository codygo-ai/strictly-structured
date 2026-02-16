import type { SizeLimits } from '@ssv/schemas/types';

export function camelCaseToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function limitsToRows(limits: SizeLimits): { label: string; value: string }[] {
  return Object.entries(limits)
    .filter(([key]) => key !== 'notes')
    .map(([key, value]) => ({
      label: camelCaseToLabel(key),
      value: value === null || value === undefined ? '\u2014' : String(value),
    }));
}
