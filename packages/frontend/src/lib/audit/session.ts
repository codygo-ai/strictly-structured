const SESSION_KEY = 'ssv_audit_session_id';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr-noop';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
