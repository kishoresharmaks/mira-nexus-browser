import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import type { SearchCategoryKey } from '@/lib/catalog';
import { readState, saveDraft } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function checkAuth(request: Request): Promise<Response | null> {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await checkAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json();
    const state = await readState();

    let foundCat: SearchCategoryKey | null = null;
    let foundIndex = -1;

    for (const catKey of Object.keys(state.draft.categories) as SearchCategoryKey[]) {
      const idx = state.draft.categories[catKey].providers.findIndex((p) => p.id === id);
      if (idx !== -1) {
        foundCat = catKey;
        foundIndex = idx;
        break;
      }
    }

    if (!foundCat || foundIndex === -1) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const current = state.draft.categories[foundCat].providers[foundIndex];
    const newEnabled = typeof body.enabled === 'boolean' ? body.enabled : !current.enabled;

    const updatedProvider = {
      ...current,
      enabled: newEnabled,
      updatedAt: new Date().toISOString(),
    };

    const nextProviders = [...state.draft.categories[foundCat].providers];
    nextProviders[foundIndex] = updatedProvider;

    const nextCategories = {
      ...state.draft.categories,
      [foundCat]: {
        ...state.draft.categories[foundCat],
        providers: nextProviders,
      },
    };

    const saveResult = await saveDraft({
      ...state.draft,
      categories: nextCategories,
    });
    if (!saveResult.ok) {
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      provider: updatedProvider,
      savedAt: saveResult.savedAt,
    });
  } catch (error) {
    console.error('Failed to update provider status', error);
    return NextResponse.json({ error: 'Failed to toggle provider status' }, { status: 500 });
  }
}
