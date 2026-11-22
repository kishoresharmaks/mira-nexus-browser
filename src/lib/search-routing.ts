import type { SearchEngine } from './catalog';
import type { SearchCategory } from '@/components/home/SearchCategories';

/**
 * Builds a category-targeted search URL based on the active search engine.
 */
export function buildCategorizedSearchUrl(
  query: string,
  category: SearchCategory,
  engine: SearchEngine,
): string {
  const encoded = encodeURIComponent(query.trim());
  const engineId = engine.id.toLowerCase();

  switch (category) {
    case 'images':
      if (engineId === 'duckduckgo') {
        return `https://duckduckgo.com/?q=${encoded}&iax=images&ia=images`;
      }
      if (engineId === 'brave') {
        return `https://search.brave.com/images?q=${encoded}`;
      }
      if (engineId === 'bing') {
        return `https://www.bing.com/images/search?q=${encoded}`;
      }
      if (engineId === 'startpage') {
        return `https://www.startpage.com/sp/search?query=${encoded}&cat=images`;
      }
      // Standard Google fallback
      return `https://www.google.com/search?q=${encoded}&tbm=isch`;

    case 'news':
      if (engineId === 'duckduckgo') {
        return `https://duckduckgo.com/?q=${encoded}&iar=news&ia=news`;
      }
      if (engineId === 'brave') {
        return `https://search.brave.com/news?q=${encoded}`;
      }
      if (engineId === 'bing') {
        return `https://www.bing.com/news/search?q=${encoded}`;
      }
      return `https://www.google.com/search?q=${encoded}&tbm=nws`;

    case 'videos':
      if (engineId === 'duckduckgo') {
        return `https://duckduckgo.com/?q=${encoded}&iax=videos&ia=videos`;
      }
      if (engineId === 'brave') {
        return `https://search.brave.com/videos?q=${encoded}`;
      }
      if (engineId === 'bing') {
        return `https://www.bing.com/videos/search?q=${encoded}`;
      }
      return `https://www.google.com/search?q=${encoded}&tbm=vid`;

    case 'ai':
      if (engineId === 'brave') {
        return `https://search.brave.com/search?q=${encoded}&source=llm`;
      }
      if (engineId === 'duckduckgo') {
        return `https://duckduckgo.com/?q=!ai+${encoded}`;
      }
      // Perplexity or AI search entry
      return `https://duckduckgo.com/?q=${encoded}`;

    case 'web':
    default:
      return engine.searchUrl.replace('%s', encoded);
  }
}
