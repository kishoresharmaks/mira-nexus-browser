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
        JSON.stringify({ error: 'The search configuration is unavailable.' }),
        { status: 503, headers: headers({ 'cache-control': 'no-store' }) },
      );
    }

    const etag = `"nexus-search-config-${catalog.revision}"`;
    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, {
        status: 304,
        headers: headers({ etag }),
      });
    }

    const responsePayload = {
      version: catalog.revision,
      updatedAt: catalog.publishedAt,
      categories: catalog.categories,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: headers({ etag }),
    });
  } catch (error) {
    console.error('public search config failed', error);
    return new Response(
      JSON.stringify({ error: 'The search configuration is temporarily unavailable.' }),
      { status: 503, headers: headers({ 'cache-control': 'no-store' }) },
    );
  }
}
