import bundled from '@/lib/default-catalog.json';

export type AdsLayout = 'inline' | 'anchored';

export type AdsConfig = {
  enabled: boolean;
  bannerEnabled?: boolean;
  rewardedEnabled?: boolean;
  testMode: boolean;
  layout: AdsLayout;
  androidUnitId: string;
  iosUnitId: string;
  androidRewardedUnitId?: string;
  iosRewardedUnitId?: string;
};

export type SearchCategoryKey = 'web' | 'ai' | 'images' | 'news' | 'videos';

export type SearchProvider = {
  id: string;
  name: string;
  category: SearchCategoryKey;
  searchUrl: string;
  suggestUrl?: string;
  note: string;
  enabled: boolean;
  priority: number;
  countries: string[];
  providerType?: 'external' | 'api';
  createdAt?: string;
  updatedAt?: string;
};

export type SearchCategoryConfig = {
  enabled: boolean;
  defaultProvider: string;
  providers: SearchProvider[];
};

export type SearchCategoriesConfig = Record<
  SearchCategoryKey,
  SearchCategoryConfig
>;

export type Engine = {
  id: string;
  name: string;
  searchUrl: string;
  note: string;
  enabled: boolean;
};

export type DiscoveryContentType =
  | 'WEBSITE'
  | 'ARTICLE'
  | 'DEVELOPER_TOOL'
  | 'ESSAY'
  | 'IDEA'
  | 'CRAFT'
  | 'READING'
  | 'AI_TOOL'
  | 'REFERENCE'
  | 'NEWS'
  | 'VIDEO'
  | 'OTHER';

export type DiscoveryCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  enabled: boolean;
  color?: string;
  contentTypes?: DiscoveryContentType[];
};

export type Page = {
  id: string;
  title: string;
  url: string;
  category: string;
  note: string;
  readMinutes: number;
  enabled: boolean;
  imageUrl?: string;
  contentType?: DiscoveryContentType;
  categoryId?: string;
  tags?: string[];
  author?: string;
  publishedAt?: string;
  expiresAt?: string;
  order?: number;
  featured?: boolean;
  dailySlot?: 'website_of_day' | 'article_of_day' | 'developer_discovery' | string | null;
  language?: string;
  country?: string;
  metadata?: Record<string, unknown>;
};

export type Catalog = {
  version: 1;
  defaultEngineId: string;
  ads: AdsConfig;
  engines: Engine[];
  pages: Page[];
  categories: SearchCategoriesConfig;
  discoveryCategories?: DiscoveryCategory[];
};

export type PublishedCatalog = Catalog & {
  revision: number;
  publishedAt: string;
};

export type StoreState = {
  draft: Catalog;
  published: PublishedCatalog | null;
};

export type PublicCatalog = {
  version: 1;
  revision: number;
  publishedAt: string;
  defaultEngineId: string;
  ads: AdsConfig;
  engines: {
    id: string;
    name: string;
    searchUrl: string;
    note: string;
  }[];
  pages: {
    id: string;
    title: string;
    url: string;
    host: string;
    category: string;
    note: string;
    readMinutes: number;
    imageUrl?: string;
    contentType?: DiscoveryContentType;
    categoryId?: string;
    tags?: string[];
    author?: string;
    publishedAt?: string;
    expiresAt?: string;
    order?: number;
    featured?: boolean;
    dailySlot?: string | null;
    language?: string;
    country?: string;
    metadata?: Record<string, unknown>;
  }[];
  categories: SearchCategoriesConfig;
  discoveryCategories: DiscoveryCategory[];
};

export type Issue = {
  at: string;
  message: string;
};

// Keep these aligned with the app's normalizeCatalog limits. Anything above
// them would be silently dropped when the app reads the public feed.
export const MAX_ENGINES = 40;
export const MAX_PROVIDERS_PER_CATEGORY = 40;
export const MAX_PAGES = 250;
const MAX_URL = 2_048;
const MARKER = 'nexusquerytoken';
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AD_UNIT_ID = /^ca-app-pub-\d{16}\/\d{10}$/;

export const SEARCH_CATEGORIES: {
  key: SearchCategoryKey;
  label: string;
  description: string;
}[] = [
  { key: 'web', label: 'Web', description: 'Primary web search engines and crawlers' },
  { key: 'ai', label: 'AI', description: 'AI conversational search engines and answer bots' },
  { key: 'images', label: 'Images', description: 'Image search and visual media discovery' },
  { key: 'news', label: 'News', description: 'Real-time and curated news publishers' },
  { key: 'videos', label: 'Videos', description: 'Video streaming and clip discovery platforms' },
];

export const DEFAULT_WEB_PROVIDERS: SearchProvider[] = [
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    category: 'web',
    searchUrl: 'https://duckduckgo.com/?q={query}',
    suggestUrl: 'https://ac.duckduckgo.com/ac/?q={query}&type=list',
    note: 'The default. No profile, no search history.',
    enabled: true,
    priority: 1,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'brave',
    name: 'Brave Search',
    category: 'web',
    searchUrl: 'https://search.brave.com/search?q={query}',
    suggestUrl: 'https://search.brave.com/api/suggest?q={query}',
    note: 'An independent index from Brave.',
    enabled: true,
    priority: 2,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'google',
    name: 'Google',
    category: 'web',
    searchUrl: 'https://www.google.com/search?q={query}',
    suggestUrl: 'https://suggestqueries.google.com/complete/search?client=chrome&q={query}',
    note: 'Google web search.',
    enabled: true,
    priority: 3,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'startpage',
    name: 'Startpage',
    category: 'web',
    searchUrl: 'https://www.startpage.com/sp/search?query={query}',
    suggestUrl: 'https://www.startpage.com/suggestions?q={query}',
    note: 'Google results through a privacy proxy.',
    enabled: true,
    priority: 4,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'qwant',
    name: 'Qwant',
    category: 'web',
    searchUrl: 'https://www.qwant.com/?q={query}',
    note: 'European search with no query profiling.',
    enabled: true,
    priority: 5,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'kagi',
    name: 'Kagi',
    category: 'web',
    searchUrl: 'https://kagi.com/search?q={query}',
    note: 'A paid, ad-free index. Sign in on Kagi site.',
    enabled: true,
    priority: 6,
    countries: ['ALL'],
    providerType: 'external',
  },
];

export const DEFAULT_AI_PROVIDERS: SearchProvider[] = [
  {
    id: 'brave-ai',
    name: 'Brave AI',
    category: 'ai',
    searchUrl: 'https://search.brave.com/search?q={query}&source=llm',
    note: 'AI-generated summary answers with source citations.',
    enabled: true,
    priority: 1,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'duckduckgo-ai',
    name: 'DuckDuckGo AI',
    category: 'ai',
    searchUrl: 'https://duckduckgo.com/?q=!ai+{query}',
    note: 'Private AI chat and search answers.',
    enabled: true,
    priority: 2,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'ai',
    searchUrl: 'https://www.perplexity.ai/search?q={query}',
    note: 'Direct conversational answers with real-time web search.',
    enabled: true,
    priority: 3,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'phind',
    name: 'Phind',
    category: 'ai',
    searchUrl: 'https://www.phind.com/search?q={query}',
    note: 'Developer-oriented intelligent search.',
    enabled: true,
    priority: 4,
    countries: ['ALL'],
    providerType: 'external',
  },
];

export const DEFAULT_IMAGES_PROVIDERS: SearchProvider[] = [
  {
    id: 'duckduckgo-images',
    name: 'DuckDuckGo Images',
    category: 'images',
    searchUrl: 'https://duckduckgo.com/?q={query}&iax=images&ia=images',
    note: 'Private image search.',
    enabled: true,
    priority: 1,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'google-images',
    name: 'Google Images',
    category: 'images',
    searchUrl: 'https://www.google.com/search?q={query}&tbm=isch',
    note: 'Google image index.',
    enabled: true,
    priority: 2,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'brave-images',
    name: 'Brave Images',
    category: 'images',
    searchUrl: 'https://search.brave.com/images?q={query}',
    note: 'Brave independent image search.',
    enabled: true,
    priority: 3,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'bing-images',
    name: 'Bing Images',
    category: 'images',
    searchUrl: 'https://www.bing.com/images/search?q={query}',
    note: 'Microsoft Bing visual search.',
    enabled: true,
    priority: 4,
    countries: ['ALL'],
    providerType: 'external',
  },
];

export const DEFAULT_NEWS_PROVIDERS: SearchProvider[] = [
  {
    id: 'duckduckgo-news',
    name: 'DuckDuckGo News',
    category: 'news',
    searchUrl: 'https://duckduckgo.com/?q={query}&iar=news&ia=news',
    note: 'Private news headlines and articles.',
    enabled: true,
    priority: 1,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'google-news',
    name: 'Google News',
    category: 'news',
    searchUrl: 'https://www.google.com/search?q={query}&tbm=nws',
    note: 'Global news aggregator.',
    enabled: true,
    priority: 2,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'brave-news',
    name: 'Brave News',
    category: 'news',
    searchUrl: 'https://search.brave.com/news?q={query}',
    note: 'Brave independent news search.',
    enabled: true,
    priority: 3,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'bing-news',
    name: 'Bing News',
    category: 'news',
    searchUrl: 'https://www.bing.com/news/search?q={query}',
    note: 'Bing news feed.',
    enabled: true,
    priority: 4,
    countries: ['ALL'],
    providerType: 'external',
  },
];

export const DEFAULT_VIDEOS_PROVIDERS: SearchProvider[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'videos',
    searchUrl: 'https://www.youtube.com/results?search_query={query}',
    suggestUrl: 'https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q={query}',
    note: 'Global video sharing platform.',
    enabled: true,
    priority: 1,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'duckduckgo-videos',
    name: 'DuckDuckGo Videos',
    category: 'videos',
    searchUrl: 'https://duckduckgo.com/?q={query}&iax=videos&ia=videos',
    note: 'Privacy video search.',
    enabled: true,
    priority: 2,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'brave-videos',
    name: 'Brave Videos',
    category: 'videos',
    searchUrl: 'https://search.brave.com/videos?q={query}',
    note: 'Brave video search without tracker injection.',
    enabled: true,
    priority: 3,
    countries: ['ALL'],
    providerType: 'external',
  },
  {
    id: 'bing-videos',
    name: 'Bing Videos',
    category: 'videos',
    searchUrl: 'https://www.bing.com/videos/search?q={query}',
    note: 'Bing video results.',
    enabled: true,
    priority: 4,
    countries: ['ALL'],
    providerType: 'external',
  },
];

export function createDefaultCategories(
  existingEngines?: Engine[],
  existingDefaultId?: string,
): SearchCategoriesConfig {
  const webProviders: SearchProvider[] =
    existingEngines && existingEngines.length > 0
      ? existingEngines.map((e, index) => ({
          id: e.id,
          name: e.name,
          category: 'web' as const,
          searchUrl: e.searchUrl.includes('%s')
            ? e.searchUrl.replace('%s', '{query}')
            : e.searchUrl,
          note: e.note,
          enabled: e.enabled !== false,
          priority: index + 1,
          countries: ['ALL'],
          providerType: 'external' as const,
        }))
      : DEFAULT_WEB_PROVIDERS;

  return {
    web: {
      enabled: true,
      defaultProvider: existingDefaultId || 'duckduckgo',
      providers: webProviders,
    },
    ai: {
      enabled: true,
      defaultProvider: 'brave-ai',
      providers: DEFAULT_AI_PROVIDERS,
    },
    images: {
      enabled: true,
      defaultProvider: 'duckduckgo-images',
      providers: DEFAULT_IMAGES_PROVIDERS,
    },
    news: {
      enabled: true,
      defaultProvider: 'duckduckgo-news',
      providers: DEFAULT_NEWS_PROVIDERS,
    },
    videos: {
      enabled: true,
      defaultProvider: 'youtube',
      providers: DEFAULT_VIDEOS_PROVIDERS,
    },
  };
}

export const DEFAULT_ADS: AdsConfig = {
  enabled: false,
  bannerEnabled: false,
  rewardedEnabled: false,
  testMode: true,
  layout: 'inline',
  androidUnitId: '',
  iosUnitId: '',
  androidRewardedUnitId: '',
  iosRewardedUnitId: '',
};

export function isAdUnitId(value: string): boolean {
  return AD_UNIT_ID.test(value);
}
const PRIVATE_HOSTNAME =
  /^(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|\[?::1\]?|.+\.local)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function urlText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, MAX_URL);
}

function cleanId(value: unknown): string {
  const id = text(value, 64).toLowerCase();
  return ID.test(id) ? id : '';
}

export function slugify(value: string, fallback = 'item'): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
  return slug || fallback;
}

export function uniqueId(base: string, taken: Set<string>): string {
  let candidate = slugify(base, 'item');
  let counter = 2;
  while (taken.has(candidate)) {
    candidate = `${slugify(base, 'item').slice(0, 58)}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

export function isPrivateHostname(hostname: string): boolean {
  return PRIVATE_HOSTNAME.test(hostname);
}

function parseHttps(
  value: string,
  options: { allowTemplate: boolean },
): URL | null {
  if (!value || value.length > MAX_URL) return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;

  const countPercentS = value.split('%s').length - 1;
  const countBraced = value.split('{query}').length - 1;
  const totalPlaceholders = countPercentS + countBraced;

  if (options.allowTemplate) {
    if (totalPlaceholders !== 1) return null;
  } else if (totalPlaceholders !== 0) {
    return null;
  }

  if (options.allowTemplate) {
    const hashPosition = value.indexOf('#');
    if (
      hashPosition !== -1 &&
      (value.slice(hashPosition).includes('%s') ||
        value.slice(hashPosition).includes('{query}'))
    ) {
      return null;
    }
  }

  try {
    const normalized = options.allowTemplate
      ? value.replace('{query}', MARKER).replace('%s', MARKER)
      : value;
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:') return null;
    if (!parsed.hostname || parsed.username || parsed.password) return null;
    if (isPrivateHostname(parsed.hostname)) return null;

    if (options.allowTemplate) {
      const inQuery = [...parsed.searchParams.values()].some((part) =>
        part.includes(MARKER),
      );
      const inPath = parsed.pathname.includes(MARKER);
      if (!inQuery && !inPath) return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isValidHttpsUrl(
  value: string,
  options: { allowTemplate: boolean },
): boolean {
  return Boolean(parseHttps(value, options));
}

export function templateFromExample(value: string): string | null {
  const raw = urlText(value);
  if (!raw) return null;
  if (raw.includes('{query}') || raw.includes('%s')) {
    return parseHttps(raw, { allowTemplate: true }) ? raw : null;
  }
  if (!parseHttps(raw, { allowTemplate: false })) return null;

  try {
    const parsed = new URL(raw);
    const preferred = ['q', 'query', 'search', 's', 'text', 'p', 'search_query'];
    const entries = [...parsed.searchParams.entries()].filter(
      ([, part]) => part.trim().length > 0,
    );
    if (entries.length === 0) return null;
    const chosen =
      preferred
        .map((key) => entries.find(([entryKey]) => entryKey === key))
        .find(Boolean) ?? entries[0];
    if (!chosen) return null;

    const [key] = chosen;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaced = raw.replace(
      new RegExp(`([?&])${escaped}=[^&#]*`),
      `$1${key}={query}`,
    );
    return parseHttps(replaced, { allowTemplate: true }) ? replaced : null;
  } catch {
    return null;
  }
}

export function buildSearchUrl(
  engine: Pick<SearchProvider, 'searchUrl'> | Pick<Engine, 'searchUrl'>,
  query = 'quantum computing',
): string | null {
  if (!isValidHttpsUrl(engine.searchUrl, { allowTemplate: true })) return null;
  const encoded = encodeURIComponent(query.trim());
  if (engine.searchUrl.includes('{query}')) {
    return engine.searchUrl.replaceAll('{query}', encoded);
  }
  return engine.searchUrl.replace('%s', encoded);
}

function enabledEngineIds(catalog: Catalog): Set<string> {
  return new Set(
    catalog.engines
      .filter((engine) => engine.enabled)
      .map((engine) => engine.id),
  );
}

/**
 * Ads are opt-in. Missing or malformed config resolves to the safe default:
 * no ads, test units, inline placement.
 */
export function coerceAds(value: unknown): AdsConfig {
  if (!isRecord(value)) return { ...DEFAULT_ADS };
  const bannerEnabled =
    typeof value.bannerEnabled === 'boolean'
      ? value.bannerEnabled
      : value.enabled === true;
  const rewardedEnabled = value.rewardedEnabled === true;

  return {
    enabled: bannerEnabled,
    bannerEnabled,
    rewardedEnabled,
    testMode: value.testMode !== false,
    layout: value.layout === 'anchored' ? 'anchored' : 'inline',
    androidUnitId: text(value.androidUnitId, 64),
    iosUnitId: text(value.iosUnitId, 64),
    androidRewardedUnitId: text(value.androidRewardedUnitId, 64),
    iosRewardedUnitId: text(value.iosRewardedUnitId, 64),
  };
}

export function coerceCategories(
  value: unknown,
  fallbackEngines?: Engine[],
  fallbackDefaultId?: string,
): SearchCategoriesConfig {
  const defaults = createDefaultCategories(fallbackEngines, fallbackDefaultId);
  if (!isRecord(value)) return defaults;

  const result: Partial<SearchCategoriesConfig> = {};

  for (const cat of SEARCH_CATEGORIES) {
    const rawCat = isRecord(value[cat.key])
      ? (value[cat.key] as Record<string, unknown>)
      : null;
    if (!rawCat) {
      result[cat.key] = defaults[cat.key];
      continue;
    }

    const enabled = rawCat.enabled !== false;
    const rawProviders = Array.isArray(rawCat.providers)
      ? rawCat.providers
      : defaults[cat.key].providers;
    const providerIds = new Set<string>();
    const providers: SearchProvider[] = [];

    for (const item of rawProviders.slice(0, MAX_PROVIDERS_PER_CATEGORY)) {
      if (!isRecord(item)) continue;
      const name = text(item.name, 40);
      const requestedId = cleanId(item.id) || slugify(name, 'provider');
      const id = providerIds.has(requestedId)
        ? uniqueId(requestedId, providerIds)
        : requestedId;
      providerIds.add(id);

      const countries = Array.isArray(item.countries)
        ? item.countries.map((c) => text(c, 10).toUpperCase()).filter(Boolean)
        : ['ALL'];

      providers.push({
        id,
        name,
        category: cat.key,
        searchUrl: urlText(item.searchUrl),
        suggestUrl: item.suggestUrl ? urlText(item.suggestUrl) : undefined,
        note: text(item.note, 160),
        enabled: item.enabled !== false,
        priority: Number.isFinite(Number(item.priority))
          ? Number(item.priority)
          : providers.length + 1,
        countries: countries.length > 0 ? countries : ['ALL'],
        providerType: item.providerType === 'api' ? 'api' : 'external',
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
      });
    }

    const requestedDefault = cleanId(rawCat.defaultProvider);
    const defaultProvider = providers.some((p) => p.id === requestedDefault)
      ? requestedDefault
      : (providers.find((p) => p.enabled)?.id ?? providers[0]?.id ?? '');

    result[cat.key] = {
      enabled,
      defaultProvider,
      providers,
    };
  }

  return result as SearchCategoriesConfig;
}

/**
 * Storage and requests are both untrusted boundaries. Coerce a payload into a
 * complete catalog without deciding whether it is publishable yet; drafts are
 * allowed to be incomplete, only the live feed is not.
 */
export function coerceCatalog(value: unknown): Catalog | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.engines) || !Array.isArray(value.pages)) {
    return null;
  }

  const engineIds = new Set<string>();
  const engines: Engine[] = [];
  for (const item of value.engines.slice(0, MAX_ENGINES)) {
    if (!isRecord(item)) continue;
    const name = text(item.name, 28);
    const requestedId = cleanId(item.id) || slugify(name, 'engine');
    const id = engineIds.has(requestedId)
      ? uniqueId(requestedId, engineIds)
      : requestedId;
    engineIds.add(id);
    engines.push({
      id,
      name,
      searchUrl: urlText(item.searchUrl),
      note: text(item.note, 120),
      enabled: item.enabled !== false,
    });
  }

  const pageIds = new Set<string>();
  const pages: Page[] = [];
  for (const item of value.pages.slice(0, MAX_PAGES)) {
    if (!isRecord(item)) continue;
    const title = text(item.title, 100);
    const requestedId = cleanId(item.id) || slugify(title, 'page');
    const id = pageIds.has(requestedId)
      ? uniqueId(requestedId, pageIds)
      : requestedId;
    pageIds.add(id);
    const rawMinutes = Number(item.readMinutes);
    const contentType = item.contentType
      ? (text(item.contentType, 24).toUpperCase() as DiscoveryContentType)
      : 'OTHER';
    const categoryId =
      cleanId(item.categoryId) || cleanId(item.category) || 'general';
    const tags = Array.isArray(item.tags)
      ? item.tags.map((t) => text(t, 32).toLowerCase()).filter(Boolean)
      : [];
    const order = Number(item.order);
    pages.push({
      id,
      title,
      url: urlText(item.url),
      category: text(item.category, 24),
      note: text(item.note, 240),
      readMinutes: Number.isFinite(rawMinutes)
        ? Math.min(120, Math.max(1, Math.round(rawMinutes)))
        : 5,
      enabled: item.enabled !== false,
      imageUrl: item.imageUrl ? urlText(item.imageUrl) : undefined,
      contentType,
      categoryId,
      tags,
      author: item.author ? text(item.author, 64) : undefined,
      publishedAt: item.publishedAt ? text(item.publishedAt, 40) : undefined,
      expiresAt: item.expiresAt ? text(item.expiresAt, 40) : undefined,
      order: Number.isFinite(order) ? Math.floor(order) : 0,
      featured: item.featured === true,
      dailySlot: item.dailySlot ? text(item.dailySlot, 32).toLowerCase() : null,
      language: item.language ? text(item.language, 10) : undefined,
      country: item.country ? text(item.country, 10) : undefined,
      metadata: isRecord(item.metadata) ? item.metadata : undefined,
    });
  }

  const catIds = new Set<string>();
  const discoveryCategories: DiscoveryCategory[] = [];
  if (Array.isArray(value.discoveryCategories)) {
    for (const item of value.discoveryCategories) {
      if (!isRecord(item)) continue;
      const name = text(item.name, 48);
      const requestedId = cleanId(item.id) || slugify(name, 'cat');
      const id = catIds.has(requestedId)
        ? uniqueId(requestedId, catIds)
        : requestedId;
      catIds.add(id);
      const rawIcon = text(item.icon, 32).toLowerCase();
      const order = Number(item.order);
      discoveryCategories.push({
        id,
        name,
        description: text(item.description, 160),
        icon: rawIcon || 'compass',
        order: Number.isFinite(order) ? Math.floor(order) : 0,
        enabled: item.enabled !== false,
        color: item.color ? text(item.color, 16) : undefined,
        contentTypes: Array.isArray(item.contentTypes)
          ? item.contentTypes.map(
              (ct) => text(ct, 24).toUpperCase() as DiscoveryContentType,
            )
          : undefined,
      });
    }
    discoveryCategories.sort((a, b) => a.order - b.order);
  }

  const requestedDefault = cleanId(value.defaultEngineId);
  const defaultEngineId = engines.some(
    (engine) => engine.id === requestedDefault,
  )
    ? requestedDefault
    : (engines.find((engine) => engine.enabled)?.id ?? engines[0]?.id ?? '');

  const categories = coerceCategories(
    value.categories,
    engines,
    defaultEngineId,
  );

  const syncedEngines: Engine[] = categories.web.providers.map((p) => ({
    id: p.id,
    name: p.name,
    searchUrl: p.searchUrl,
    note: p.note,
    enabled: p.enabled,
  }));
  const effectiveDefaultEngineId =
    categories.web.defaultProvider || defaultEngineId;

  return {
    version: 1,
    defaultEngineId: effectiveDefaultEngineId,
    ads: coerceAds(value.ads),
    engines: syncedEngines.length > 0 ? syncedEngines : engines,
    pages: pages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    categories,
    discoveryCategories,
  };
}

export function validateCatalog(catalog: Catalog): Issue[] {
  const issues: Issue[] = [];
  const liveEngines = catalog.engines.filter((engine) => engine.enabled);
  const livePages = catalog.pages.filter((page) => page.enabled);

  if (liveEngines.length === 0) {
    issues.push({
      at: 'Search engines',
      message: 'At least one engine must be live.',
    });
  }
  if (catalog.pages.length > 0 && livePages.length === 0) {
    issues.push({
      at: "Today's page",
      message: 'At least one page must be live when pages are configured.',
    });
  }

  const engineIds = new Set<string>();
  for (const engine of catalog.engines) {
    const at = `Search engine “${engine.name || 'Untitled'}”`;
    if (!ID.test(engine.id) || engineIds.has(engine.id)) {
      issues.push({ at, message: 'The id is missing or duplicated.' });
    }
    engineIds.add(engine.id);

    if (!engine.enabled) continue;
    if (!engine.name) {
      issues.push({ at: 'Untitled engine', message: 'Give it a name.' });
    }
    if (!isValidHttpsUrl(engine.searchUrl, { allowTemplate: true })) {
      issues.push({
        at,
        message:
          'Use an https search URL with exactly one %s where the query goes.',
      });
    }
    if (engine.note.length > 120) {
      issues.push({ at, message: 'The note is longer than 120 characters.' });
    }
  }

  const liveDefault = catalog.engines.find(
    (engine) => engine.id === catalog.defaultEngineId,
  );
  if (!liveDefault) {
    issues.push({
      at: 'Default engine',
      message: 'Choose a default engine.',
    });
  } else if (!liveDefault.enabled) {
    issues.push({
      at: 'Default engine',
      message: 'The default engine must be live.',
    });
  }

  const pageIds = new Set<string>();
  for (const page of catalog.pages) {
    const at = `Today page “${page.title || 'Untitled'}”`;
    if (!ID.test(page.id) || pageIds.has(page.id)) {
      issues.push({ at, message: 'The id is missing or duplicated.' });
    }
    pageIds.add(page.id);

    if (!page.enabled) continue;
    if (!page.title) {
      issues.push({ at: 'Untitled page', message: 'Give it a title.' });
    }
    if (!isValidHttpsUrl(page.url, { allowTemplate: false })) {
      issues.push({ at, message: 'Use a plain https page URL.' });
    }
    if (page.category.length > 24) {
      issues.push({ at, message: 'The category is longer than 24 characters.' });
    }
    if (page.note.length > 180) {
      issues.push({ at, message: 'The note is longer than 180 characters.' });
    }
    if (
      !Number.isInteger(page.readMinutes) ||
      page.readMinutes < 1 ||
      page.readMinutes > 120
    ) {
      issues.push({
        at,
        message: 'Reading time must be between 1 and 120 minutes.',
      });
    }
  }

  const ads = catalog.ads;
  const bannerActive = ads.bannerEnabled ?? ads.enabled;
  if (bannerActive && !ads.testMode) {
    const androidValid = isAdUnitId(ads.androidUnitId);
    const iosValid = isAdUnitId(ads.iosUnitId);
    if (ads.androidUnitId && !androidValid) {
      issues.push({
        at: 'Android banner ad unit',
        message:
          'Use a live Android unit ID in the form ca-app-pub-<16 digits>/<10 digits>.',
      });
    }
    if (ads.iosUnitId && !iosValid) {
      issues.push({
        at: 'iOS banner ad unit',
        message:
          'Use a live iOS unit ID in the form ca-app-pub-<16 digits>/<10 digits>.',
      });
    }
    if (!androidValid && !iosValid) {
      issues.push({
        at: 'Banner Ads',
        message:
          'Add a valid Android or iOS banner ad unit ID, or turn test mode back on.',
      });
    }
  }

  if (ads.rewardedEnabled && !ads.testMode) {
    const androidValid = isAdUnitId(ads.androidRewardedUnitId || '');
    const iosValid = isAdUnitId(ads.iosRewardedUnitId || '');
    if (ads.androidRewardedUnitId && !androidValid) {
      issues.push({
        at: 'Android rewarded ad unit',
        message:
          'Use a live Android unit ID in the form ca-app-pub-<16 digits>/<10 digits>.',
      });
    }
    if (ads.iosRewardedUnitId && !iosValid) {
      issues.push({
        at: 'iOS rewarded ad unit',
        message:
          'Use a live iOS unit ID in the form ca-app-pub-<16 digits>/<10 digits>.',
      });
    }
    if (!androidValid && !iosValid) {
      issues.push({
        at: 'Rewarded Ads',
        message:
          'Add a valid Android or iOS rewarded ad unit ID, or turn test mode back on.',
      });
    }
  }

  // Validate Categories and Search Providers
  for (const cat of SEARCH_CATEGORIES) {
    const categoryConfig = catalog.categories[cat.key];
    const catLabel = `Category “${cat.label}”`;

    if (categoryConfig.enabled) {
      const live = categoryConfig.providers.filter((p) => p.enabled);
      if (live.length === 0) {
        issues.push({
          at: catLabel,
          message: `At least one search provider in ${cat.label} must be enabled.`,
        });
      }

      const defaultProvider = categoryConfig.providers.find(
        (p) => p.id === categoryConfig.defaultProvider,
      );
      if (!defaultProvider) {
        issues.push({
          at: catLabel,
          message: `Choose a default provider for ${cat.label}.`,
        });
      } else if (!defaultProvider.enabled) {
        issues.push({
          at: catLabel,
          message: `The default provider for ${cat.label} must be enabled.`,
        });
      }
    }

    const providerIds = new Set<string>();
    for (const p of categoryConfig.providers) {
      const at = `${cat.label} provider “${p.name || 'Untitled'}”`;
      if (!ID.test(p.id) || providerIds.has(p.id)) {
        issues.push({ at, message: 'Provider ID is missing or duplicated.' });
      }
      providerIds.add(p.id);

      if (!p.enabled) continue;
      if (!p.name) {
        issues.push({ at: 'Untitled provider', message: 'Give it a name.' });
      }
      if (!isValidHttpsUrl(p.searchUrl, { allowTemplate: true })) {
        issues.push({
          at,
          message: 'Use an https search URL containing {query} (or %s).',
        });
      }
      if (p.suggestUrl && !isValidHttpsUrl(p.suggestUrl, { allowTemplate: true })) {
        issues.push({
          at,
          message: 'Suggestion URL must be an https URL containing {query} (or %s).',
        });
      }
      if (p.note && p.note.length > 160) {
        issues.push({ at, message: 'Note is longer than 160 characters.' });
      }
    }
  }

  return issues;
}

export function toPublicCatalog(
  published: PublishedCatalog,
): PublicCatalog | null {
  const engines = published.engines
    .filter((engine) => engine.enabled)
    .map(({ id, name, searchUrl, note }) => ({ id, name, searchUrl, note }));
  const pages = published.pages
    .filter((page) => page.enabled)
    .map((page) => ({
      id: page.id,
      title: page.title,
      url: page.url,
      host: hostOf(page.url),
      category: page.category.trim().toUpperCase() || 'READING',
      note: page.note,
      readMinutes: page.readMinutes,
      imageUrl: page.imageUrl,
      contentType: page.contentType || 'OTHER',
      categoryId: page.categoryId || 'general',
      tags: page.tags || [],
      author: page.author,
      publishedAt: page.publishedAt,
      expiresAt: page.expiresAt,
      order: page.order ?? 0,
      featured: page.featured === true,
      dailySlot: page.dailySlot ?? null,
      language: page.language,
      country: page.country,
      metadata: page.metadata,
    }));

  if (engines.length === 0) return null;
  const liveIds = new Set(engines.map((engine) => engine.id));

  const discoveryCategories: DiscoveryCategory[] = (
    published.discoveryCategories ?? []
  )
    .filter((c) => c.enabled !== false)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      order: c.order,
      enabled: c.enabled,
      color: c.color,
      contentTypes: c.contentTypes,
    }))
    .sort((a, b) => a.order - b.order);

  const publicCategories: SearchCategoriesConfig = {
    web: {
      enabled: published.categories?.web?.enabled !== false,
      defaultProvider:
        published.categories?.web?.defaultProvider || published.defaultEngineId,
      providers: (published.categories?.web?.providers ?? []).filter((p) => p.enabled),
    },
    ai: {
      enabled: published.categories?.ai?.enabled !== false,
      defaultProvider: published.categories?.ai?.defaultProvider || 'brave-ai',
      providers: (published.categories?.ai?.providers ?? []).filter((p) => p.enabled),
    },
    images: {
      enabled: published.categories?.images?.enabled !== false,
      defaultProvider:
        published.categories?.images?.defaultProvider || 'duckduckgo-images',
      providers: (published.categories?.images?.providers ?? []).filter((p) => p.enabled),
    },
    news: {
      enabled: published.categories?.news?.enabled !== false,
      defaultProvider:
        published.categories?.news?.defaultProvider || 'duckduckgo-news',
      providers: (published.categories?.news?.providers ?? []).filter((p) => p.enabled),
    },
    videos: {
      enabled: published.categories?.videos?.enabled !== false,
      defaultProvider: published.categories?.videos?.defaultProvider || 'youtube',
      providers: (published.categories?.videos?.providers ?? []).filter((p) => p.enabled),
    },
  };

  return {
    version: 1,
    revision: published.revision,
    publishedAt: published.publishedAt,
    defaultEngineId: liveIds.has(published.defaultEngineId)
      ? published.defaultEngineId
      : engines[0].id,
    ads: { ...published.ads },
    engines,
    pages,
    categories: publicCategories,
    discoveryCategories,
  };
}

type BundledShape = {
  version: number;
  revision: number;
  publishedAt: string;
  defaultEngineId: string;
  ads?: unknown;
  engines: { id: string; name: string; searchUrl: string; note: string }[];
  pages: {
    id: string;
    title: string;
    url: string;
    category: string;
    note: string;
    readMinutes: number;
  }[];
  categories?: unknown;
};

const bundledCatalog = bundled as BundledShape;

export function createSeedState(): StoreState {
  const defaultCats = createDefaultCategories();
  const draft: Catalog = {
    version: 1,
    defaultEngineId: bundledCatalog.defaultEngineId,
    ads: coerceAds(bundledCatalog.ads),
    engines: bundledCatalog.engines.map((engine) => ({
      ...engine,
      enabled: true,
    })),
    pages: bundledCatalog.pages.map((page) => ({ ...page, enabled: true })),
    categories: defaultCats,
  };

  return {
    draft,
    published: {
      ...draft,
      engines: draft.engines.map((engine) => ({ ...engine })),
      pages: draft.pages.map((page) => ({ ...page })),
      categories: JSON.parse(JSON.stringify(defaultCats)),
      revision: Number.isFinite(bundledCatalog.revision)
        ? bundledCatalog.revision
        : 1,
      publishedAt: bundledCatalog.publishedAt,
    },
  };
}

export function coerceStoreState(value: unknown): StoreState | null {
  if (!isRecord(value)) return null;
  const draft = coerceCatalog(value.draft);
  const publishedBase = coerceCatalog(value.published);
  if (!draft && !publishedBase) return null;

  let published: PublishedCatalog | null = null;
  if (publishedBase) {
    const rawRevision = Number(
      isRecord(value.published) ? value.published.revision : 0,
    );
    const revision =
      Number.isFinite(rawRevision) && rawRevision > 0
        ? Math.floor(rawRevision)
        : 1;
    const rawDate = isRecord(value.published)
      ? text(value.published.publishedAt, 40)
      : '';
    const publishedAt = Number.isNaN(Date.parse(rawDate))
      ? new Date().toISOString()
      : rawDate;
    published = { ...publishedBase, revision, publishedAt };
  }

  const fallback = published ?? createSeedState().published;
  return { draft: draft ?? fallback ?? createSeedState().draft, published };
}

export function liveCounts(catalog: Catalog): { engines: number; pages: number } {
  return {
    engines: catalog.engines.filter((engine) => engine.enabled).length,
    pages: catalog.pages.filter((page) => page.enabled).length,
  };
}

const DAY_MS = 86_400_000;
const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function daySerial(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS,
  );
}

function atOffset(from: Date, offset: number): Date {
  return new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() - offset,
    12,
  );
}

export type RotationDay = {
  date: Date;
  label: string;
  weekday: string;
  page: Page | null;
  isToday: boolean;
};

export function getRotation(
  pages: Page[],
  count = 7,
  from = new Date(),
): RotationDay[] {
  const live = pages.filter((page) => page.enabled);
  return Array.from({ length: count }, (_, offset) => {
    const date = atOffset(from, offset);
    const serial = daySerial(date);
    const index =
      live.length > 0 ? ((serial % live.length) + live.length) % live.length : 0;
    return {
      date,
      label: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
      weekday: WEEKDAYS[date.getDay()],
      page: live.length > 0 ? live[index] : null,
      isToday: offset === 0,
    };
  });
}

export function formatUtcDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())} UTC`;
}

export function sentenceCase(value: string): string {
  if (!value) return '';
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
