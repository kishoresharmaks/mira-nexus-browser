import { NextResponse } from 'next/server';
import { coerceCatalog } from '@/lib/catalog';
import { isAuthenticated, sameOrigin } from '@/lib/auth';
import { readState, saveDraft, storageMode } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY = 400_000;

async function guard(request: Request): Promise<Response | null> {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: 'Cross-origin request refused.' },
      { status: 403 },
    );
  }
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;

  try {
    const state = await readState();
    return NextResponse.json({
      draft: state.draft,
      published: state.published,
      storage: storageMode(),
    });
  } catch (error) {
    console.error('draft read failed', error);
    return NextResponse.json(
      { error: 'The catalog could not be read.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY) {
    return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Send a JSON body.' },
      { status: 400 },
    );
  }

  const input =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>).draft
      : undefined;
  const draft = coerceCatalog(input);
  if (!draft) {
    return NextResponse.json(
      { error: 'That draft is missing its engine or page list.' },
      { status: 400 },
    );
  }

  try {
    const saved = await saveDraft(draft);
    if (!saved.ok) {
      return NextResponse.json(
        { error: 'The draft changed elsewhere. Reload the desk and try again.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ draft, savedAt: saved.savedAt });
  } catch (error) {
    console.error('draft save failed', error);
    return NextResponse.json(
      { error: 'The draft could not be saved.' },
      { status: 500 },
    );
  }
}
