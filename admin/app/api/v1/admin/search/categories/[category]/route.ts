import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { SEARCH_CATEGORIES, type SearchCategoryKey } from '@/lib/catalog';
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
  { params }: { params: Promise<{ category: string }> },
) {
  const unauthorized = await checkAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const { category } = await params;
    const catKey = category.toLowerCase() as SearchCategoryKey;

    const validCategory = SEARCH_CATEGORIES.some((c) => c.key === catKey);
    if (!validCategory) {
      return NextResponse.json(
        { error: 'Category must be one of: web, ai, images, news, videos' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const state = await readState();
    const current = state.draft.categories[catKey];

    if (!current) {
      return NextResponse.json({ error: 'Category configuration not found' }, { status: 404 });
    }

    const nextEnabled = typeof body.enabled === 'boolean' ? body.enabled : current.enabled;
    let nextDefault = current.defaultProvider;

    if (body.defaultProvider !== undefined) {
      const targetProvider = current.providers.find((p) => p.id === body.defaultProvider);
      if (!targetProvider) {
        return NextResponse.json(
          { error: `Default provider ID '${body.defaultProvider}' does not exist in category '${catKey}'` },
          { status: 400 },
        );
      }
      nextDefault = body.defaultProvider;
    }

    const nextCategories = {
      ...state.draft.categories,
      [catKey]: {
        ...current,
        enabled: nextEnabled,
        defaultProvider: nextDefault,
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
      category: nextCategories[catKey],
      savedAt: saveResult.savedAt,
    });
  } catch (error) {
    console.error('Failed to update category', error);
    return NextResponse.json({ error: 'Failed to update category settings' }, { status: 500 });
  }
}
