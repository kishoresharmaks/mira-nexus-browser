import type { CuratedPage } from '@/types';
import bundledJson from './default-catalog.json';

export type SearchEngine = {
  id: string;
  name: string;
  /** A complete search URL with exactly one `%s` placeholder. */
  searchUrl: string;
  note: string;
};

export type Catalog = {
  version: 1;
  revision: number;
  publishedAt: string;
  defaultEngineId: string;
  engines: SearchEngine[];
  pages: CuratedPage[];
};

export type SearchMatch = {
  engine: SearchEngine;
  query: string;
};

const MAX_ENGINES = 40;
const MAX_PAGES = 250;
const MAX_URL = 2_048;
const MARKER = 'miraquerytoken';
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw.length > MAX_URL) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;

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
    engines,
    pages,
  };
}

const bundled = normalizeCatalog(bundledJson);
if (!bundled) {
  throw new Error('The bundled Mira catalog is invalid');
}

export const BUNDLED_CATALOG: Catalog = bundled;
export const DEFAULT_SEARCH_ENGINE =
  BUNDLED_CATALOG.engines.find(
    (engine) => engine.id === BUNDLED_CATALOG.defaultEngineId,
  ) ?? BUNDLED_CATALOG.engines[0];

export function buildSearchUrl(
  query: string,
  engine: SearchEngine = DEFAULT_SEARCH_ENGINE,
): string {
  const template = parseHttpsUrl(engine.searchUrl, { allowTemplate: true });
  const target = template ?? DEFAULT_SEARCH_ENGINE.searchUrl;
  return target.replace('%s', encodeURIComponent(query.trim()));
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
