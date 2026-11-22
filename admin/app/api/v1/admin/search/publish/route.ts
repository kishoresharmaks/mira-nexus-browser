import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { validateCatalog, type PublishedCatalog } from '@/lib/catalog';
import { publishState, readState } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const state = await readState();
    const issues = validateCatalog(state.draft);
    if (issues.length > 0) {
      return NextResponse.json(
        { error: 'Cannot publish: configuration has validation issues.', issues },
        { status: 422 },
      );
    }

    const currentRevision = state.published?.revision ?? 0;
    const nextRevision = currentRevision + 1;
    const now = new Date().toISOString();

    const published: PublishedCatalog = {
      ...state.draft,
      revision: nextRevision,
      publishedAt: now,
    };

    const result = await publishState(
      {
        draft: state.draft,
        published,
      },
      currentRevision,
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: 'A newer revision was published by another administrator. Please refresh.' },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      revision: nextRevision,
      publishedAt: now,
      savedAt: result.savedAt,
    });
  } catch (error) {
    console.error('Failed to publish search configuration', error);
    return NextResponse.json({ error: 'Failed to publish search configuration' }, { status: 500 });
  }
}
