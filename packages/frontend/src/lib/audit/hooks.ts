'use client';

import type { AuditEventKind } from '@ssv/audit/browser';
import { useEffect, useRef, useCallback } from 'react';

import { emit as rawEmit, startAutoFlush, stopAutoFlush } from './emitter';

export function useAudit() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      startAutoFlush();
      initialized.current = true;
    }
    return () => {
      stopAutoFlush();
    };
  }, []);

  const emit = useCallback(
    (kind: AuditEventKind, data: Record<string, unknown>, traceId?: string) => {
      rawEmit(kind, data, traceId);
    },
    [],
  );

  return { emit };
}
