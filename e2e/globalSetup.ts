const BASE_URL = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const CONNECT_TIMEOUT_MS = 15_000;

const NOT_REACHABLE_MSG = `Cannot reach ${BASE_URL}. Start the app first (e.g. pnpm run dev:e2e), then run pnpm run e2e in another terminal.`;

async function globalSetup(): Promise<void> {
  try {
    const res = await fetch(BASE_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS),
    });
    if (!res.ok) return;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isConnectionFailure =
      msg.includes('refused') ||
      msg.includes('fetch failed') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('timeout') ||
      msg.includes('aborted');
    if (isConnectionFailure) {
      throw new Error(NOT_REACHABLE_MSG);
    }
    throw err;
  }
}

export default globalSetup;
