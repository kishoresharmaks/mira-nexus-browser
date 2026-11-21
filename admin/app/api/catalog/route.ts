import { createSeedState, toPublicCatalog } from '@/lib/catalog';
import { readState } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600';

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': CACHE,
    'access-control-allow-origin': '*',
    'x-content-type-options': 'nosniff',
    ...extra,
  };
}

export async function GET(request: Request) {
  try {
    const state = await readState();
    const source = state.published ?? createSeedState().published;
    const catalog = source ? toPublicCatalog(source) : null;
    if (!catalog) {
      return new Response(
        JSON.stringify({ error: 'The published catalog is incomplete.' }),
        { status: 503, headers: headers({ 'cache-control': 'no-store' }) },
      );
    }

    const etag = `"nexus-catalog-${catalog.revision}"`;
    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, {
        status: 304,
        headers: headers({ etag }),
      });
    }

    return new Response(JSON.stringify(catalog), {
      status: 200,
      headers: headers({ etag }),
    });
  } catch (error) {
    console.error('public catalog failed', error);
    return new Response(
      JSON.stringify({ error: 'The catalog is unavailable.' }),
      { status: 503, headers: headers({ 'cache-control': 'no-store' }) },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-max-age': '86400',
    },
  });
}
