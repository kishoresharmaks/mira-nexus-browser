import {
  buildSearchUrl,
  type SearchCategoriesConfig,
  type SearchCategoryKey,
  type SearchEngine,
  type SearchProvider,
} from './catalog';

/**
 * Builds a category-targeted search URL based on dynamic remote categories
 * and the active search engine. NO search URLs are hardcoded in the client.
 */
export function buildCategorizedSearchUrl(
  query: string,
  category: SearchCategoryKey,
  engine: SearchEngine,
  categories?: SearchCategoriesConfig,
): string {
  const trimmed = query.trim();
  if (!trimmed) return '';

  if (categories) {
    const catConfig = categories[category];
    if (catConfig && catConfig.enabled && catConfig.providers.length > 0) {
      const enabledProviders = catConfig.providers.filter((p) => p.enabled);
      const matched =
        enabledProviders.find((p) => p.id === engine.id) ??
        enabledProviders.find((p) => p.id === catConfig.defaultProvider) ??
        enabledProviders[0];

      if (matched && matched.searchUrl) {
        return buildSearchUrl(trimmed, matched.searchUrl);
      }
    }
  }

  // Fallback to active engine searchUrl template if category is web or unavailable
  return buildSearchUrl(trimmed, engine);
}

/**
 * Resolves the active provider for a category to display in the UI.
 */
export function getActiveCategoryProvider(
  category: SearchCategoryKey,
  engine: SearchEngine,
  categories?: SearchCategoriesConfig,
): SearchProvider | null {
  if (!categories) return null;
  const catConfig = categories[category];
  if (!catConfig || !catConfig.enabled) return null;
  const enabledProviders = catConfig.providers.filter((p) => p.enabled);
  return (
    enabledProviders.find((p) => p.id === engine.id) ??
    enabledProviders.find((p) => p.id === catConfig.defaultProvider) ??
    enabledProviders[0] ??
    null
  );
}
