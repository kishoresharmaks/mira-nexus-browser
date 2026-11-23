import {
  buildSearchUrl,
  type SearchCategoriesConfig,
  type SearchCategoryKey,
  type SearchEngine,
  type SearchProvider,
} from './catalog';

export type CategorizedSearchResolution =
  | {
      success: true;
      url: string;
      category: SearchCategoryKey;
      provider: SearchProvider | SearchEngine;
    }
  | {
      success: false;
      error: string;
      fallbackUrl?: string;
      category: SearchCategoryKey;
      provider?: SearchProvider | SearchEngine;
    };

/**
 * Resolves a categorized search query with full validation:
 * - Empty query check
 * - Category enabled state
 * - Provider selection (preferredProviderId -> category default -> engine match -> first enabled)
 * - Provider URL template validation
 * - Special character and Unicode URL encoding
 * - Meaningful error messages without silent redirection
 */
export function resolveCategorizedSearch(
  query: string,
  category: SearchCategoryKey,
  engine: SearchEngine,
  categories?: SearchCategoriesConfig,
  preferredProviderId?: string,
): CategorizedSearchResolution {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Search query cannot be empty.',
      category,
    };
  }

  const catConfig = categories?.[category];

  // Check if category is explicitly disabled in remote configuration
  if (catConfig && !catConfig.enabled) {
    return {
      success: false,
      error: `The ${category.toUpperCase()} search category is currently disabled.`,
      fallbackUrl: buildSearchUrl(trimmed, engine),
      category,
    };
  }

  const enabledProviders = (catConfig?.providers ?? []).filter((p) => p.enabled);

  // If a category has a config but 0 enabled providers
  if (catConfig && enabledProviders.length === 0) {
    return {
      success: false,
      error: `No active search providers configured for ${category.toUpperCase()}.`,
      fallbackUrl: buildSearchUrl(trimmed, engine),
      category,
    };
  }

  // Resolve best provider:
  // 1. Explicit user-selected preferred provider (if enabled)
  // 2. Category default provider (if enabled)
  // 3. Provider matching current active engine id
  // 4. First enabled provider in category
  const provider =
    (preferredProviderId
      ? enabledProviders.find((p) => p.id === preferredProviderId)
      : undefined) ??
    (catConfig
      ? enabledProviders.find((p) => p.id === catConfig.defaultProvider)
      : undefined) ??
    enabledProviders.find((p) => p.id === engine.id) ??
    enabledProviders[0];

  if (!provider) {
    // If Web category and no provider resolved, use active web engine
    if (category === 'web') {
      const url = buildSearchUrl(trimmed, engine);
      return {
        success: true,
        url,
        category: 'web',
        provider: {
          id: engine.id,
          name: engine.name,
          category: 'web',
          searchUrl: engine.searchUrl,
          note: engine.note,
          enabled: true,
          priority: 1,
          countries: ['ALL'],
        },
      };
    }

    return {
      success: false,
      error: `No provider available for ${category.toUpperCase()}.`,
      fallbackUrl: buildSearchUrl(trimmed, engine),
      category,
    };
  }

  // Validate provider searchUrl template
  if (
    !provider.searchUrl ||
    (!provider.searchUrl.includes('{query}') && !provider.searchUrl.includes('%s'))
  ) {
    return {
      success: false,
      error: `Search provider "${provider.name}" has an invalid search template.`,
      fallbackUrl: buildSearchUrl(trimmed, engine),
      category,
      provider,
    };
  }

  const url = buildSearchUrl(trimmed, provider.searchUrl);
  return {
    success: true,
    url,
    category,
    provider,
  };
}

/**
 * Builds a category-targeted search URL based on dynamic remote categories
 * and the active search engine. NO search URLs are hardcoded in the client.
 */
export function buildCategorizedSearchUrl(
  query: string,
  category: SearchCategoryKey,
  engine: SearchEngine,
  categories?: SearchCategoriesConfig,
  preferredProviderId?: string,
): string {
  const resolution = resolveCategorizedSearch(
    query,
    category,
    engine,
    categories,
    preferredProviderId,
  );
  if (resolution.success) {
    return resolution.url;
  }
  return resolution.fallbackUrl ?? buildSearchUrl(query.trim(), engine);
}

/**
 * Resolves the active provider for a category to display in the UI.
 */
export function getActiveCategoryProvider(
  category: SearchCategoryKey,
  engine: SearchEngine,
  categories?: SearchCategoriesConfig,
  preferredProviderId?: string,
): SearchProvider | null {
  if (!categories) return null;
  const catConfig = categories[category];
  if (!catConfig || !catConfig.enabled) return null;
  const enabledProviders = catConfig.providers.filter((p) => p.enabled);
  if (enabledProviders.length === 0) return null;

  if (preferredProviderId) {
    const found = enabledProviders.find((p) => p.id === preferredProviderId);
    if (found) return found;
  }

  return (
    enabledProviders.find((p) => p.id === catConfig.defaultProvider) ??
    enabledProviders.find((p) => p.id === engine.id) ??
    enabledProviders[0] ??
    null
  );
}
