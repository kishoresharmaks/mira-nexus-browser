import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import {
  isValidHttpsUrl,
  type SearchCategoryKey,
  type SearchProvider,
} from '@/lib/catalog';
import { readState, saveDraft } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function checkAuth(request: Request): Promise<Response | null> {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function PUT(
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

    if (body.name !== undefined && (!body.name || typeof body.name !== 'string' || !body.name.trim())) {
      return NextResponse.json({ error: 'Provider name cannot be empty' }, { status: 400 });
    }

    if (body.searchUrl !== undefined) {
      if (!body.searchUrl || !isValidHttpsUrl(body.searchUrl, { allowTemplate: true })) {
        return NextResponse.json(
          { error: 'Search URL must be a valid https URL containing {query} or %s' },
          { status: 400 },
        );
      }
    }

    if (body.suggestUrl !== undefined && body.suggestUrl) {
      if (!isValidHttpsUrl(body.suggestUrl, { allowTemplate: true })) {
        return NextResponse.json(
          { error: 'Suggestion URL must be a valid https URL containing {query} or %s' },
          { status: 400 },
        );
      }
    }

    const updatedProvider: SearchProvider = {
      ...current,
      name: body.name ? body.name.trim().slice(0, 40) : current.name,
      searchUrl: body.searchUrl ? body.searchUrl.trim() : current.searchUrl,
      suggestUrl: body.suggestUrl !== undefined ? (body.suggestUrl ? body.suggestUrl.trim() : undefined) : current.suggestUrl,
      note: body.note !== undefined ? body.note.trim().slice(0, 160) : current.note,
      enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
      priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : current.priority,
      countries: Array.isArray(body.countries) && body.countries.length > 0
        ? body.countries.map((c: unknown) => String(c).trim().toUpperCase())
        : current.countries,
      providerType: body.providerType === 'api' ? 'api' : 'external',
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
    console.error('Failed to update provider', error);
    return NextResponse.json({ error: 'Failed to update search provider' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await checkAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const state = await readState();

    let foundCat: SearchCategoryKey | null = null;

    for (const catKey of Object.keys(state.draft.categories) as SearchCategoryKey[]) {
      if (state.draft.categories[catKey].providers.some((p) => p.id === id)) {
        foundCat = catKey;
        break;
      }
    }

    if (!foundCat) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const catConfig = state.draft.categories[foundCat];
    const filteredProviders = catConfig.providers.filter((p) => p.id !== id);

    let nextDefault = catConfig.defaultProvider;
    if (nextDefault === id) {
      nextDefault = filteredProviders.find((p) => p.enabled)?.id ?? filteredProviders[0]?.id ?? '';
    }

    const nextCategories = {
      ...state.draft.categories,
      [foundCat]: {
        ...catConfig,
        defaultProvider: nextDefault,
        providers: filteredProviders,
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
      deletedId: id,
      savedAt: saveResult.savedAt,
    });
  } catch (error) {
    console.error('Failed to delete provider', error);
    return NextResponse.json({ error: 'Failed to delete search provider' }, { status: 500 });
  }
}
