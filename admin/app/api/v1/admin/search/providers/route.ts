import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import {
  isValidHttpsUrl,
  uniqueId,
  slugify,
  type SearchCategoryKey,
  type SearchProvider,
  SEARCH_CATEGORIES,
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

export async function GET(request: Request) {
  const unauthorized = await checkAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const state = await readState();
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category') as SearchCategoryKey | null;

    const allProviders: SearchProvider[] = [];
    for (const catKey of Object.keys(state.draft.categories) as SearchCategoryKey[]) {
      if (!categoryFilter || categoryFilter === catKey) {
        allProviders.push(...(state.draft.categories[catKey]?.providers ?? []));
      }
    }

    return NextResponse.json({
      providers: allProviders,
      categories: state.draft.categories,
      defaultEngineId: state.draft.defaultEngineId,
    });
  } catch (error) {
    console.error('Failed to list providers', error);
    return NextResponse.json({ error: 'Failed to retrieve providers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await checkAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { name, category, searchUrl, suggestUrl, note, priority, countries, providerType } = body;

    const validCategory = SEARCH_CATEGORIES.some((c) => c.key === category);
    if (!validCategory) {
      return NextResponse.json(
        { error: 'Category must be one of: web, ai, images, news, videos' },
        { status: 400 },
      );
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Provider name is required' }, { status: 400 });
    }

    if (!searchUrl || typeof searchUrl !== 'string' || !isValidHttpsUrl(searchUrl, { allowTemplate: true })) {
      return NextResponse.json(
        { error: 'Search URL must be a valid https URL containing {query} or %s' },
        { status: 400 },
      );
    }

    if (suggestUrl && !isValidHttpsUrl(suggestUrl, { allowTemplate: true })) {
      return NextResponse.json(
        { error: 'Suggestion URL must be a valid https URL containing {query} or %s' },
        { status: 400 },
      );
    }

    const state = await readState();
    const catConfig = state.draft.categories[category as SearchCategoryKey];
    const takenIds = new Set(catConfig.providers.map((p) => p.id));
    const newId = uniqueId(slugify(name.trim()), takenIds);

    const now = new Date().toISOString();
    const newProvider: SearchProvider = {
      id: newId,
      name: name.trim().slice(0, 40),
      category: category as SearchCategoryKey,
      searchUrl: searchUrl.trim(),
      suggestUrl: suggestUrl ? suggestUrl.trim() : undefined,
      note: typeof note === 'string' ? note.trim().slice(0, 160) : '',
      enabled: body.enabled !== false,
      priority: Number.isFinite(Number(priority)) ? Number(priority) : catConfig.providers.length + 1,
      countries: Array.isArray(countries) && countries.length > 0
        ? countries.map((c) => String(c).trim().toUpperCase())
        : ['ALL'],
      providerType: providerType === 'api' ? 'api' : 'external',
      createdAt: now,
      updatedAt: now,
    };

    const nextProviders = [...catConfig.providers, newProvider];
    const nextCategories = {
      ...state.draft.categories,
      [category]: {
        ...catConfig,
        providers: nextProviders,
        defaultProvider: catConfig.defaultProvider || newId,
      },
    };

    const nextDraft = {
      ...state.draft,
      categories: nextCategories,
    };

    const saveResult = await saveDraft(nextDraft);
    if (!saveResult.ok) {
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, provider: newProvider, savedAt: saveResult.savedAt },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create provider', error);
    return NextResponse.json({ error: 'Failed to create search provider' }, { status: 500 });
  }
}
