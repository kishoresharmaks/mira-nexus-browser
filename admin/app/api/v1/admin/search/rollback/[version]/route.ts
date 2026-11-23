import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { rollbackToVersion } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ version: string }> },
) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { version } = await params;
    const targetRev = Number(version);

    if (!Number.isInteger(targetRev) || targetRev < 1) {
      return NextResponse.json({ error: 'Invalid version number' }, { status: 400 });
    }

    const actor =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'admin';

    const result = await rollbackToVersion(targetRev, { rolledBackBy: actor });

    return NextResponse.json({
      ok: true,
      message: `Successfully rolled back to version ${targetRev}. Published as version ${result.newRevision}.`,
      newRevision: result.newRevision,
      savedAt: result.savedAt,
    });
  } catch (error: any) {
    console.error('Rollback failed', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to rollback version' },
      { status: 500 },
    );
  }
}
