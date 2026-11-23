import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { getVersionHistory, readState } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const state = await readState();
    const history = await getVersionHistory();

    return NextResponse.json({
      currentRevision: state.published?.revision ?? 0,
      currentPublishedAt: state.published?.publishedAt ?? null,
      versions: history.map((v) => ({
        revision: v.revision,
        publishedAt: v.publishedAt,
        summary: v.summary,
        publishedBy: v.publishedBy,
        description: v.description,
        checksum: v.checksum,
      })).reverse(), // newest first
    });
  } catch (error) {
    console.error('Failed to list versions', error);
    return NextResponse.json({ error: 'Failed to retrieve version history' }, { status: 500 });
  }
}
