import bundled from '@/lib/default-catalog.json';

export type Engine = {
  id: string;
  name: string;
  searchUrl: string;
  note: string;
  enabled: boolean;
};

export type Page = {
  id: string;
  title: string;
  url: string;
  category: string;
  note: string;
  readMinutes: number;
  enabled: boolean;
};

export type Catalog = {
  version: 1;
  defaultEngineId: string;
  engines: Engine[];
  pages: Page[];
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
  }[];
};

export type Issue = {
  at: string;
  message: string;
};

// Keep these aligned with the app's normalizeCatalog limits. Anything above
// them would be silently dropped when the app reads the public feed.
export const MAX_ENGINES = 40;
export const MAX_PAGES = 250;
const MAX_URL = 2_048;
const MARKER = 'miraquerytoken';
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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

  const placeholders = value.split('%s').length - 1;
  if (options.allowTemplate) {
    if (placeholders !== 1) return null;
  } else if (placeholders !== 0) {
    return null;
  }

  if (options.allowTemplate) {
    const hashPosition = value.indexOf('#');
    if (hashPosition !== -1 && value.slice(hashPosition).includes('%s')) {
      return null;
    }
  }

  try {
    const parsed = new URL(
      options.allowTemplate ? value.replace('%s', MARKER) : value,
    );
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
  if (raw.includes('%s')) {
    return parseHttps(raw, { allowTemplate: true }) ? raw : null;
  }
  if (!parseHttps(raw, { allowTemplate: false })) return null;

  try {
    const parsed = new URL(raw);
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
    const replaced = raw.replace(
      new RegExp(`([?&])${escaped}=[^&#]*`),
      `$1${key}=%s`,
    );
    return parseHttps(replaced, { allowTemplate: true }) ? replaced : null;
  } catch {
    return null;
  }
}

export function buildSearchUrl(
  engine: Pick<Engine, 'searchUrl'>,
  query = 'quiet web',
): string | null {
  if (!isValidHttpsUrl(engine.searchUrl, { allowTemplate: true })) return null;
  return engine.searchUrl.replace('%s', encodeURIComponent(query));
}

function enabledEngineIds(catalog: Catalog): Set<string> {
  return new Set(
    catalog.engines
      .filter((engine) => engine.enabled)
      .map((engine) => engine.id),
  );
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
    pages.push({
      id,
      title,
      url: urlText(item.url),
      category: text(item.category, 24),
      note: text(item.note, 180),
      readMinutes: Number.isFinite(rawMinutes)
        ? Math.min(120, Math.max(1, Math.round(rawMinutes)))
        : 8,
      enabled: item.enabled !== false,
    });
  }

  const requestedDefault = cleanId(value.defaultEngineId);
  const defaultEngineId = engines.some(
    (engine) => engine.id === requestedDefault,
  )
    ? requestedDefault
    : (engines.find((engine) => engine.enabled)?.id ?? engines[0]?.id ?? '');

  return { version: 1, defaultEngineId, engines, pages };
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
  if (livePages.length === 0) {
    issues.push({
      at: "Today's page",
      message: 'At least one page must be live.',
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
    .map(({ id, title, url, category, note, readMinutes }) => ({
      id,
      title,
      url,
      host: hostOf(url),
      category: category.trim().toUpperCase() || 'READING',
      note,
      readMinutes,
    }));

  if (engines.length === 0 || pages.length === 0) return null;
  const liveIds = new Set(engines.map((engine) => engine.id));

  return {
    version: 1,
    revision: published.revision,
    publishedAt: published.publishedAt,
    defaultEngineId: liveIds.has(published.defaultEngineId)
      ? published.defaultEngineId
      : engines[0].id,
    engines,
    pages,
  };
}

type BundledShape = {
  version: number;
  revision: number;
  publishedAt: string;
  defaultEngineId: string;
  engines: { id: string; name: string; searchUrl: string; note: string }[];
  pages: {
    id: string;
    title: string;
    url: string;
    category: string;
    note: string;
    readMinutes: number;
  }[];
};

const bundledCatalog = bundled as BundledShape;

export function createSeedState(): StoreState {
  const draft: Catalog = {
    version: 1,
    defaultEngineId: bundledCatalog.defaultEngineId,
    engines: bundledCatalog.engines.map((engine) => ({
      ...engine,
      enabled: true,
    })),
    pages: bundledCatalog.pages.map((page) => ({ ...page, enabled: true })),
  };

  return {
    draft,
    published: {
      ...draft,
      engines: draft.engines.map((engine) => ({ ...engine })),
      pages: draft.pages.map((page) => ({ ...page })),
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
