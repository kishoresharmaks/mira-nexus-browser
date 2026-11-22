import type { CuratedPage } from '@/types';
import bundledJson from './default-catalog.json';

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

export type SearchEngine = {
  id: string;
  name: string;
  /** A complete search URL with exactly one `%s` or `{query}` placeholder. */
  searchUrl: string;
  note: string;
};

export type Catalog = {
  version: 1;
  revision: number;
  publishedAt: string;
  defaultEngineId: string;
  ads: AdsConfig;
  engines: SearchEngine[];
  pages: CuratedPage[];
  categories: SearchCategoriesConfig;
};

export type SearchMatch = {
  engine: SearchEngine;
  query: string;
};

const MAX_ENGINES = 40;
const MAX_PAGES = 250;
const MAX_URL = 2_048;
const MARKER = 'nexusquerytoken';
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AD_UNIT_ID = /^ca-app-pub-\d{16}\/\d{10}$/;
const PRIVATE_HOSTNAME =
  /^(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|\[?::1\]?|.+\.local)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function cleanId(value: unknown): string {
  const id = cleanText(value, 64).toLowerCase();
  return ID.test(id) ? id : '';
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

function normalizeAds(value: unknown): AdsConfig {
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
    androidUnitId:
      typeof value.androidUnitId === 'string'
        ? value.androidUnitId.trim().slice(0, 64)
        : '',
    iosUnitId:
      typeof value.iosUnitId === 'string'
        ? value.iosUnitId.trim().slice(0, 64)
        : '',
    androidRewardedUnitId:
      typeof value.androidRewardedUnitId === 'string'
        ? value.androidRewardedUnitId.trim().slice(0, 64)
        : '',
    iosRewardedUnitId:
      typeof value.iosRewardedUnitId === 'string'
        ? value.iosRewardedUnitId.trim().slice(0, 64)
        : '',
  };
}

function hostOfUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

function isPrivateHostname(hostname: string): boolean {
  return PRIVATE_HOSTNAME.test(hostname);
}

function parseHttpsUrl(
  value: unknown,
  options: { allowTemplate: boolean },
): string | null {
  let raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw.length > MAX_URL) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;

  if (options.allowTemplate && raw.includes('{query}')) {
    raw = raw.replace(/\{query\}/g, '%s');
  }

  const placeholders = raw.split('%s').length - 1;
  if (options.allowTemplate) {
    if (placeholders !== 1) return null;
  } else if (placeholders !== 0) {
    return null;
  }

  const probe = options.allowTemplate ? raw.replace('%s', MARKER) : raw;
  try {
    const parsed = new URL(probe);
    if (parsed.protocol !== 'https:') return null;
    if (!parsed.hostname || parsed.username || parsed.password) return null;
    if (isPrivateHostname(parsed.hostname)) return null;
    // A query template is only detectable in the path or query string. A hash
    // template would never reach the server, so treat it as invalid.
    if (options.allowTemplate) {
      const hashPosition = raw.indexOf('#');
      if (hashPosition !== -1 && raw.slice(hashPosition).includes('%s')) {
        return null;
      }
      const hasQueryMarker = [...parsed.searchParams.values()].some((part) =>
        part.includes(MARKER),
      );
      const hasPathMarker = parsed.pathname.includes(MARKER);
      if (!hasQueryMarker && !hasPathMarker) return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export function normalizeEngine(value: unknown): SearchEngine | null {
  if (!isRecord(value)) return null;
  const id = cleanId(value.id);
  const name = cleanText(value.name, 28);
  const searchUrl = parseHttpsUrl(value.searchUrl, { allowTemplate: true });
  if (!id || !name || !searchUrl) return null;
  return {
    id,
    name,
    searchUrl,
    note: cleanText(value.note, 120),
  };
}

export function normalizePage(value: unknown): CuratedPage | null {
  if (!isRecord(value)) return null;
  const id = cleanId(value.id);
  const title = cleanText(value.title, 100);
  const url = parseHttpsUrl(value.url, { allowTemplate: false });
  if (!id || !title || !url) return null;

  const readMinutes = Number(value.readMinutes);
  return {
    id,
    title,
    url,
    host: hostOfUrl(url),
    category: cleanText(value.category, 24).toUpperCase() || 'READING',
    note: cleanText(value.note, 180),
    readMinutes: Number.isFinite(readMinutes)
      ? Math.min(120, Math.max(1, Math.round(readMinutes)))
      : 8,
  };
}

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
  existingEngines?: SearchEngine[],
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
          enabled: true,
          priority: index + 1,
          countries: ['ALL'],
          providerType: 'external',
        }))
      : DEFAULT_WEB_PROVIDERS;

  return {
    web: {
      enabled: true,
      defaultProvider:
        existingDefaultId && webProviders.some((p) => p.id === existingDefaultId)
          ? existingDefaultId
          : (webProviders[0]?.id ?? 'duckduckgo'),
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

function normalizeCategories(
  value: unknown,
  existingEngines: SearchEngine[],
  defaultEngineId: string,
): SearchCategoriesConfig {
  const defaults = createDefaultCategories(existingEngines, defaultEngineId);
  if (!isRecord(value)) return defaults;

  const result: SearchCategoriesConfig = { ...defaults };
  const validKeys: SearchCategoryKey[] = ['web', 'ai', 'images', 'news', 'videos'];

  for (const key of validKeys) {
    const rawCat = value[key];
    if (!isRecord(rawCat)) continue;

    const enabled = typeof rawCat.enabled === 'boolean' ? rawCat.enabled : true;
    const providers: SearchProvider[] = [];

    if (Array.isArray(rawCat.providers)) {
      for (const item of rawCat.providers.slice(0, 40)) {
        if (!isRecord(item)) continue;
        const id = cleanId(item.id);
        const name = cleanText(item.name, 48);
        const searchUrl = parseHttpsUrl(item.searchUrl, { allowTemplate: true });
        if (!id || !name || !searchUrl) continue;

        providers.push({
          id,
          name,
          category: key,
          searchUrl,
          suggestUrl: typeof item.suggestUrl === 'string' ? item.suggestUrl : undefined,
          note: cleanText(item.note, 200),
          enabled: item.enabled !== false,
          priority: typeof item.priority === 'number' ? item.priority : providers.length + 1,
          countries: Array.isArray(item.countries) ? item.countries.map(String) : ['ALL'],
          providerType: item.providerType === 'api' ? 'api' : 'external',
        });
      }
    }

    const finalProviders = providers.length > 0 ? providers : defaults[key].providers;
    const defaultProvider = cleanId(rawCat.defaultProvider) || defaults[key].defaultProvider;

    result[key] = {
      enabled,
      defaultProvider: finalProviders.some((p) => p.id === defaultProvider)
        ? defaultProvider
        : (finalProviders[0]?.id ?? ''),
      providers: finalProviders,
    };
  }

  return result;
}

/** The boundary between bundled or remote data and the app. */
export function normalizeCatalog(value: unknown): Catalog | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.engines) || !Array.isArray(value.pages)) {
    return null;
  }

  const seenEngines = new Set<string>();
  const engines: SearchEngine[] = [];
  for (const item of value.engines.slice(0, MAX_ENGINES)) {
    if (isRecord(item) && item.enabled === false) continue;
    const engine = normalizeEngine(item);
    if (!engine || seenEngines.has(engine.id)) continue;
    seenEngines.add(engine.id);
    engines.push(engine);
  }
  if (engines.length === 0) return null;

  const seenPages = new Set<string>();
  const pages: CuratedPage[] = [];
  for (const item of value.pages.slice(0, MAX_PAGES)) {
    if (isRecord(item) && item.enabled === false) continue;
    const page = normalizePage(item);
    if (!page || seenPages.has(page.id)) continue;
    seenPages.add(page.id);
    pages.push(page);
  }
  if (pages.length === 0) return null;

  const revision = Number(value.revision);
  const defaultEngineId = cleanId(value.defaultEngineId);
  return {
    version: 1,
    revision: Number.isFinite(revision) && revision > 0 ? Math.floor(revision) : 0,
    publishedAt: cleanText(value.publishedAt, 40),
    defaultEngineId: engines.some((engine) => engine.id === defaultEngineId)
      ? defaultEngineId
      : engines[0].id,
    ads: normalizeAds(value.ads),
    engines,
    pages,
    categories: normalizeCategories(value.categories, engines, defaultEngineId),
  };
}

const bundled = normalizeCatalog(bundledJson);
if (!bundled) {
  throw new Error('The bundled Nexus catalog is invalid');
}

export const BUNDLED_CATALOG: Catalog = bundled;
export const DEFAULT_SEARCH_ENGINE =
  BUNDLED_CATALOG.engines.find(
    (engine) => engine.id === BUNDLED_CATALOG.defaultEngineId,
  ) ?? BUNDLED_CATALOG.engines[0];

export function buildSearchUrl(
  query: string,
  engineOrUrl: SearchEngine | string = DEFAULT_SEARCH_ENGINE,
): string {
  const rawUrl =
    typeof engineOrUrl === 'string' ? engineOrUrl : engineOrUrl.searchUrl;
  const template = parseHttpsUrl(rawUrl, { allowTemplate: true });
  const target = template ?? DEFAULT_SEARCH_ENGINE.searchUrl;
  const normalized = target.includes('{query}')
    ? target.replace(/\{query\}/g, '%s')
    : target;
  return normalized.replace('%s', encodeURIComponent(query.trim()));
}

type CompiledTemplate = {
  engine: SearchEngine;
  host: string;
  path: string;
  queryKey: string | null;
  pathPattern: RegExp | null;
};

const compiledTemplates = new Map<string, CompiledTemplate | null>();

function compileTemplate(engine: SearchEngine): CompiledTemplate | null {
  const cached = compiledTemplates.get(engine.searchUrl);
  if (cached !== undefined) return cached;

  const raw = parseHttpsUrl(engine.searchUrl, { allowTemplate: true });
  if (!raw) {
    compiledTemplates.set(engine.searchUrl, null);
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw.replace('%s', MARKER));
  } catch {
    compiledTemplates.set(engine.searchUrl, null);
    return null;
  }

  let queryKey: string | null = null;
  for (const [key, value] of parsed.searchParams) {
    if (value.includes(MARKER)) {
      queryKey = key;
      break;
    }
  }

  let pathPattern: RegExp | null = null;
  if (parsed.pathname.includes(MARKER)) {
    const parts = parsed.pathname.split(MARKER).map((part) =>
      part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
    pathPattern = new RegExp(`^${parts.join('([^/]+)')}/?$`);
  }

  const compiled: CompiledTemplate = {
    engine,
    host: parsed.hostname.replace(/^www\./i, '').toLowerCase(),
    path: parsed.pathname,
    queryKey,
    pathPattern,
  };
  compiledTemplates.set(engine.searchUrl, compiled);
  return compiled;
}

function decodeQuery(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function matchSearchUrl(
  url: string,
  engine: SearchEngine,
): string | null {
  const compiled = compileTemplate(engine);
  if (!compiled) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  if (host !== compiled.host) return null;

  if (compiled.queryKey) {
    // DuckDuckGo redirects between `/` and `/html/`; when the template keeps
    // the root path, accept any path on the same host.
    if (compiled.path !== '/' && parsed.pathname !== compiled.path) return null;
    const query = parsed.searchParams.get(compiled.queryKey);
    return query?.trim() ? query : null;
  }

  if (compiled.pathPattern) {
    const match = parsed.pathname.match(compiled.pathPattern);
    const query = match?.[1]?.trim();
    return query ? decodeQuery(query) : null;
  }

  return null;
}

export function searchMatchFromUrl(
  url: string,
  engines: SearchEngine[] = BUNDLED_CATALOG.engines,
): SearchMatch | null {
  if (!url) return null;
  for (const engine of engines) {
    const query = matchSearchUrl(url, engine);
    if (query) return { engine, query };
  }
  return null;
}

/** The query to show in the address field, or null for an ordinary page. */
export function searchQueryFromUrl(
  url: string,
  engines: SearchEngine[] = BUNDLED_CATALOG.engines,
): string | null {
  return searchMatchFromUrl(url, engines)?.query ?? null;
}

export function searchEngineFromUrl(
  url: string,
  engines: SearchEngine[] = BUNDLED_CATALOG.engines,
): SearchEngine | null {
  return searchMatchFromUrl(url, engines)?.engine ?? null;
}

/**
 * Turn a pasted results URL into a template by replacing its query value with
 * `%s`. A user who pastes `https://example.com/search?q=cats` should not have
 * to know the syntax before adding their own engine.
 */
export function templateFromExample(value: string): string | null {
  const raw = value.trim();
  if (!raw || raw.length > MAX_URL) return null;
  if (raw.includes('%s')) {
    return parseHttpsUrl(raw, { allowTemplate: true });
  }

  const url = parseHttpsUrl(raw, { allowTemplate: false });
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const preferred = ['q', 'query', 'search', 's', 'text', 'p'];
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
    const replaced = url.replace(
      new RegExp(`([?&])${escaped}=[^&]*`),
      `$1${key}=%s`,
    );
    return parseHttpsUrl(replaced, { allowTemplate: true });
  } catch {
    return null;
  }
}

export function validateCustomEngine(input: {
  name: string;
  searchUrl: string;
}): { engine?: SearchEngine; error?: string } {
  const name = cleanText(input.name, 28);
  if (!name) return { error: 'Give the engine a name.' };

  const template = templateFromExample(input.searchUrl);
  if (!template) {
    return {
      error:
        'Paste an https search URL with a query, or a template containing one %s.',
    };
  }

  const id = `custom-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)}-${Math.random().toString(36).slice(2, 6)}`;
  const engine = normalizeEngine({
    id,
    name,
    searchUrl: template,
    note: 'Added on this device.',
  });
  return engine ? { engine } : { error: 'That search URL cannot be used.' };
}

export function normalizeCustomEngines(value: unknown): SearchEngine[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const engines: SearchEngine[] = [];
  for (const item of value.slice(0, 20)) {
    const engine = normalizeEngine(item);
    if (!engine || seen.has(engine.id) || !engine.id.startsWith('custom-')) {
      continue;
    }
    seen.add(engine.id);
    engines.push(engine);
  }
  return engines;
}
