import { NextResponse } from 'next/server';
import { coerceCatalog, validateCatalog } from '@/lib/catalog';
import { isAuthenticated, sameOrigin } from '@/lib/auth';
import { publishState, readState } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY = 400_000;

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: 'Cross-origin request refused.' },
      { status: 403 },
    );
  }
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY) {
    return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // An empty body means "publish the saved draft". The UI sends the draft so
    // the revision it reviewed is the revision that goes live.
  }

  const supplied =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>).draft
      : undefined;

  try {
    const state = await readState();
    const draft = supplied ? coerceCatalog(supplied) : state.draft;
    if (!draft) {
      return NextResponse.json(
        { error: 'That draft is missing its engine or page list.' },
        { status: 400 },
      );
    }

    const issues = validateCatalog(draft);
    if (issues.length > 0) {
      return NextResponse.json(
        { error: 'Fix the catalog before publishing.', issues },
        { status: 422 },
      );
    }

    const expectedRevision = state.published?.revision ?? 0;
    const revision = expectedRevision + 1;
    const published = {
      ...draft,
      engines: draft.engines.map((engine) => ({ ...engine })),
      pages: draft.pages.map((page) => ({ ...page })),
      revision,
      publishedAt: new Date().toISOString(),
    };

    const saved = await publishState({ draft, published }, expectedRevision);
    if (!saved.ok) {
      return NextResponse.json(
        {
          error:
            'The catalog changed while you were publishing. Reload the desk and try again.',
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      draft,
      published,
      savedAt: saved.savedAt,
      issues: [],
    });
  } catch (error) {
    console.error('publish failed', error);
    return NextResponse.json(
      { error: 'The catalog could not be published.' },
      { status: 500 },
    );
  }
}
