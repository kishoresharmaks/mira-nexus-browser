import { authConfigured } from '@/lib/auth';
import { pingStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  'x-robots-tag': 'noindex, nofollow',
};

/**
 * Used by Docker and uptime checks. It reports only whether the two required
 * pieces are usable; connection strings and error text never leave the server.
 */
export async function GET() {
  const startedAt = Date.now();
  const auth = authConfigured();

  let storage = false;
  try {
    await pingStore();
    storage = true;
  } catch {
    storage = false;
  }

  const ok = auth && storage;
  return new Response(
    JSON.stringify({
      ok,
      service: 'mira-catalog-admin',
      checks: {
        auth: auth ? 'ok' : 'missing',
        storage: storage ? 'ok' : 'unavailable',
      },
      latencyMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    }),
    { status: ok ? 200 : 503, headers: HEADERS },
  );
}
