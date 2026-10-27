import { Platform } from 'react-native';
import type {
  CommunityComment,
  CommunityPlatform,
  CommunityThread,
} from '@/types';
import { isPrivateHostname } from './url';

/**
 * Community discussion lookup.
 *
 * Mira asks two public, login-free services whether the page you are reading
 * has been discussed: Hacker News (through Algolia's read-only HN Search API)
 * and Lobsters. Only the page address is sent. There is no developer server,
 * no account, and no analytics. Results live in memory for fifteen minutes and
 * are never written to history or trails.
 */

const HN_SEARCH = 'https://hn.algolia.com/api/v1/search';
const HN_ITEM = 'https://hn.algolia.com/api/v1/items';
const LOBSTERS_LOOKUP = 'https://lobste.rs/stories/url/all';
const LOBSTERS_STORY = 'https://lobste.rs/s';

const CACHE_TTL = 15 * 60 * 1000;
const CACHE_LIMIT = 32;
const REQUEST_TIMEOUT = 12_000;
const COMMENT_LIMIT = 120;
const COMMENT_DEPTH = 6;

const TRACKING_PARAMS = new Set([
  '_ga',
  '_gl',
  '_hsenc',
  '_hsmi',
  'dclid',
  'fbclid',
  'gbraid',
  'gclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'mkt_tok',
  'msclkid',
  'oly_anon_id',
  'oly_enc_id',
  'ref',
  'ref_src',
  'ref_url',
  's',
  'share',
  'share_id',
  'si',
  'source',
  'spm',
  'vero_id',
  'wbraid',
  'yclid',
]);

const SEARCH_HOSTS = new Set([
  'bing.com',
  'duckduckgo.com',
  'ecosia.org',
  'google.com',
  'kagi.com',
  'search.brave.com',
  'startpage.com',
]);

const SEARCH_PATHS = [
  '/search',
  '/sp/search',
  '/html',
];

type CacheEntry<T> = {
  value: T;
  storedAt: number;
};

const lookupCache = new Map<string, CacheEntry<CommunityLookup>>();
const commentCache = new Map<string, CacheEntry<CommunityComments>>();

export type CommunityLookup = {
  articleUrl: string;
  canonicalUrl: string;
  threads: CommunityThread[];
  /** At least one service failed; the result is useful but not complete. */
  failed: boolean;
  checkedAt: number;
};

export type CommunityComments = {
  comments: CommunityComment[];
  loaded: number;
  truncated: boolean;
};

export function normalizeCommunityEnabled(value: unknown): boolean {
  return typeof value === 'boolean' ? value : true;
}

function readCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  // Keep recently used entries at the end of the insertion order.
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function writeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
) {
  cache.delete(key);
  cache.set(key, { value, storedAt: Date.now() });
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (typeof oldest !== 'string') break;
    cache.delete(oldest);
  }
}

export function invalidateCommunityLookup(url: string) {
  const canonical = canonicalizeArticleUrl(url);
  if (canonical) lookupCache.delete(`lookup:${canonical}`);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function idValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

function timestampValue(seconds: unknown, iso: unknown): number {
  const numeric = numberValue(seconds);
  if (numeric > 0) return numeric * 1000;
  const text = stringValue(iso);
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hostKey(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
}

/**
 * React Native's URL polyfill matches the scheme case-sensitively in its
 * `pathname` getter. Normalise the scheme before parsing so `HTTP://…` and
 * `https://…` produce the same canonical key.
 */
function parseWebUrl(raw: string): URL | null {
  try {
    const normalized = raw.replace(
      /^([a-z][a-z0-9+.-]*):/i,
      (_, scheme: string) => `${scheme.toLowerCase()}:`,
    );
    const parsed = new URL(normalized);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return null;
    if (!parsed.hostname) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isSearchResult(host: string, pathname: string): boolean {
  if (host === 'duckduckgo.com' || host.endsWith('.duckduckgo.com')) {
    return true;
  }
  if (!SEARCH_HOSTS.has(host)) return false;
  return SEARCH_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * The browser should not look for discussions on a search result page, on the
 * discussion sites themselves, or on a private/development host. Those lookups
 * would be noise, and the last would leak an address the public APIs cannot
 * possibly know.
 */
export function shouldLookupCommunity(url: string): boolean {
  const parsed = parseWebUrl(url);
  if (!parsed) return false;
  if (parsed.username || parsed.password) return false;

  const rawHost = parsed.hostname;
  if (isPrivateHostname(rawHost)) return false;

  const host = hostKey(rawHost);
  if (!host) return false;
  if (
    host === 'news.ycombinator.com' ||
    host === 'hn.algolia.com' ||
    host === 'lobste.rs'
  ) {
    return false;
  }
  if (isSearchResult(host, parsed.pathname)) return false;

  return true;
}

/**
 * A stable identity for an article. Scheme, `www.`, a trailing slash, a
 * fragment, and common tracking parameters are ignored so an `http` post from
 * 2014 still matches the `https` page open today.
 */
export function canonicalizeArticleUrl(raw: string): string | null {
  const parsed = parseWebUrl(raw);
  if (!parsed) return null;
  if (parsed.username || parsed.password) return null;

  const host = hostKey(parsed.hostname);
  if (!host) return null;

  let path = parsed.pathname.replace(/\/{2,}/g, '/');
  if (path === '/') path = '';
  else path = path.replace(/\/+$/, '');

  const query: [string, string][] = [];
  parsed.searchParams.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (TRACKING_PARAMS.has(normalized)) return;
    if (normalized.startsWith('utm_')) return;
    query.push([key, value]);
  });
  query.sort(([keyA, valueA], [keyB, valueB]) => {
    if (keyA === keyB) return valueA.localeCompare(valueB);
    return keyA.localeCompare(keyB);
  });

  const search =
    query.length > 0
      ? `?${query
          .map(
            ([key, value]) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
          )
          .join('&')}`
      : '';

  return `${host}${path}${search}`;
}

export function sameCommunityPage(left: string, right: string): boolean {
  const leftKey = canonicalizeArticleUrl(left);
  if (!leftKey) return false;
  return leftKey === canonicalizeArticleUrl(right);
}

export function formatCommunityCount(value: number): string {
  const count = Math.max(0, Math.round(value));
  if (count < 1000) return String(count);
  if (count < 10_000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${Math.round(count / 1000)}k`;
}

export function communityPlatformLabel(platform: CommunityPlatform): string {
  return platform === 'hn' ? 'Hacker News' : 'Lobsters';
}

function threadHeat(thread: CommunityThread): number {
  return thread.commentsCount * 2 + thread.points;
}

function pickBestThreads(threads: CommunityThread[]): CommunityThread[] {
  const best = new Map<CommunityPlatform, CommunityThread>();
  for (const thread of threads) {
    const current = best.get(thread.platform);
    if (
      !current ||
      threadHeat(thread) > threadHeat(current) ||
      (threadHeat(thread) === threadHeat(current) &&
        thread.createdAt > current.createdAt)
    ) {
      best.set(thread.platform, thread);
    }
  }
  return [...best.values()].sort((a, b) => threadHeat(b) - threadHeat(a));
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted) controller.abort();
  else signal.addEventListener('abort', abort);
  const timer = setTimeout(abort, REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}

type HnHit = {
  objectID?: unknown;
  title?: unknown;
  url?: unknown;
  points?: unknown;
  num_comments?: unknown;
  author?: unknown;
  created_at?: unknown;
  created_at_i?: unknown;
};

type HnSearchResponse = {
  hits?: unknown;
};

type HnItem = {
  id?: unknown;
  author?: unknown;
  text?: unknown;
  created_at?: unknown;
  created_at_i?: unknown;
  deleted?: unknown;
  dead?: unknown;
  children?: unknown;
};

type LobstersStory = {
  short_id?: unknown;
  short_id_url?: unknown;
  created_at?: unknown;
  title?: unknown;
  url?: unknown;
  score?: unknown;
  comment_count?: unknown;
  submitter_user?: unknown;
};

type LobstersComment = {
  short_id?: unknown;
  created_at?: unknown;
  parent_comment?: unknown;
  comment?: unknown;
  comment_plain?: unknown;
  commenting_user?: unknown;
  is_deleted?: unknown;
  is_moderated?: unknown;
};

type LobstersStoryDetail = LobstersStory & {
  comments?: unknown;
};

function cleanThreadTitle(value: string, fallback: string): string {
  const title = value.trim();
  return title ? title.slice(0, 180) : fallback;
}

function titleFallback(canonical: string): string {
  return canonical.split(/[/?]/, 1)[0] || 'Discussion';
}

async function lookupHackerNews(
  canonical: string,
  signal: AbortSignal,
): Promise<CommunityThread[]> {
  const params = new URLSearchParams();
  params.set('query', canonical);
  params.set('tags', 'story');
  params.set('restrictSearchableAttributes', 'url');
  params.set('hitsPerPage', '50');

  const data = await fetchJson<HnSearchResponse>(
    `${HN_SEARCH}?${params.toString()}`,
    signal,
  );
  const hits = Array.isArray(data.hits) ? (data.hits as HnHit[]) : [];
  const threads: CommunityThread[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    if (!hit || typeof hit !== 'object') continue;
    const id = idValue(hit.objectID);
    const hitUrl = stringValue(hit.url);
    if (!id || !hitUrl) continue;
    if (canonicalizeArticleUrl(hitUrl) !== canonical) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    threads.push({
      id,
      platform: 'hn',
      title: cleanThreadTitle(stringValue(hit.title), titleFallback(canonical)),
      url: hitUrl,
      discussionUrl: `https://news.ycombinator.com/item?id=${encodeURIComponent(id)}`,
      points: numberValue(hit.points),
      commentsCount: numberValue(hit.num_comments),
      author: stringValue(hit.author),
      createdAt: timestampValue(hit.created_at_i, hit.created_at),
    });
  }

  return threads;
}

async function lookupLobsters(
  canonical: string,
  signal: AbortSignal,
): Promise<CommunityThread[]> {
  // lobste.rs does not send CORS headers. Browser builds therefore skip this
  // source rather than logging a guaranteed CORS failure on every page.
  if (Platform.OS === 'web') return [];

  const data = await fetchJson<unknown>(
    `${LOBSTERS_LOOKUP}?url=${encodeURIComponent(`https://${canonical}`)}`,
    signal,
  );
  const stories = Array.isArray(data) ? (data as LobstersStory[]) : [];
  const threads: CommunityThread[] = [];
  const seen = new Set<string>();

  for (const story of stories) {
    if (!story || typeof story !== 'object') continue;
    const id = stringValue(story.short_id);
    const storyUrl = stringValue(story.url);
    if (!id || !storyUrl) continue;
    if (canonicalizeArticleUrl(storyUrl) !== canonical) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    const shortIdUrl = stringValue(story.short_id_url);
    const discussionUrl = /^https:\/\/lobste\.rs\/s\/[a-z0-9]+$/i.test(
      shortIdUrl,
    )
      ? shortIdUrl
      : `https://lobste.rs/s/${encodeURIComponent(id)}`;

    threads.push({
      id,
      platform: 'lobsters',
      title: cleanThreadTitle(stringValue(story.title), titleFallback(canonical)),
      url: storyUrl,
      discussionUrl,
      points: numberValue(story.score),
      commentsCount: numberValue(story.comment_count),
      author: stringValue(story.submitter_user),
      createdAt: timestampValue(undefined, story.created_at),
    });
  }

  return threads;
}

/**
 * Look up public threads for one page. Both services are queried in parallel;
 * one failing source does not hide the other. Returns `null` for pages that
 * should never be looked up.
 */
export async function lookupCommunityThreads(
  url: string,
  signal: AbortSignal,
  options: { force?: boolean } = {},
): Promise<CommunityLookup | null> {
  if (!shouldLookupCommunity(url)) return null;

  const canonical = canonicalizeArticleUrl(url);
  if (!canonical) return null;

  const key = `lookup:${canonical}`;
  if (!options.force) {
    const cached = readCache(lookupCache, key);
    if (cached) return cached;
  }

  const requests: Promise<CommunityThread[]>[] = [
    lookupHackerNews(canonical, signal),
  ];
  if (Platform.OS !== 'web') {
    requests.push(lookupLobsters(canonical, signal));
  }

  const settled = await Promise.allSettled(requests);
  if (signal.aborted) return null;

  const threads: CommunityThread[] = [];
  let failed = false;
  for (const result of settled) {
    if (result.status === 'fulfilled') threads.push(...result.value);
    else failed = true;
  }

  const lookup: CommunityLookup = {
    articleUrl: url,
    canonicalUrl: canonical,
    threads: pickBestThreads(threads),
    failed,
    checkedAt: Date.now(),
  };

  if (!failed) writeCache(lookupCache, key, lookup);
  return lookup;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  copy: '©',
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  middot: '·',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  rdquo: '”',
  rsquo: '’',
  times: '×',
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#(x?)([0-9a-f]+);/gi, (match, hex, code) => {
      const parsed = Number.parseInt(code, hex ? 16 : 10);
      if (!Number.isFinite(parsed)) return match;
      try {
        return String.fromCodePoint(parsed);
      } catch {
        return match;
      }
    })
    .replace(/&([a-z]+);/gi, (match, name) => {
      return NAMED_ENTITIES[name.toLowerCase()] ?? match;
    });
}

/**
 * HN returns comment bodies as a small HTML fragment. The sheet renders plain
 * text, so preserve paragraphs, lists, and preformatted code while dropping the
 * markup and decoding the entities a reader would see.
 */
export function htmlToText(html: string): string {
  if (!html) return '';

  const text = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*p(?:\s[^>]*)?>/gi, '\n\n')
    .replace(/<\s*\/p\s*>/gi, '\n\n')
    .replace(/<\s*div(?:\s[^>]*)?>/gi, '\n')
    .replace(/<\s*\/div\s*>/gi, '\n')
    .replace(/<\s*li(?:\s[^>]*)?>/gi, '\n• ')
    .replace(/<\s*\/li\s*>/gi, '\n')
    .replace(/<\s*\/?blockquote(?:\s[^>]*)?>/gi, '\n')
    .replace(/<\s*pre(?:\s[^>]*)?>/gi, '\n\n')
    .replace(/<\s*\/pre\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '');

  return decodeEntities(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function hnComment(
  item: HnItem,
  level: number,
  counter: { loaded: number; truncated: boolean },
): CommunityComment[] {
  if (!Array.isArray(item.children)) return [];
  const out: CommunityComment[] = [];

  for (const child of item.children as HnItem[]) {
    if (!child || typeof child !== 'object') continue;
    if (counter.loaded >= COMMENT_LIMIT) {
      counter.truncated = true;
      break;
    }

    // Deleted or removed comments still anchor live replies. Keep the replies
    // at the same depth instead of silently dropping the conversation below
    // the tombstone.
    if (child.deleted === true || child.dead === true) {
      out.push(...hnComment(child, level, counter));
      continue;
    }

    const text = htmlToText(stringValue(child.text));
    if (!text) {
      out.push(...hnComment(child, level, counter));
      continue;
    }

    counter.loaded += 1;
    const deeper =
      level + 1 <= COMMENT_DEPTH ? hnComment(child, level + 1, counter) : [];
    if (level + 1 > COMMENT_DEPTH && Array.isArray(child.children)) {
      if (child.children.length > 0) counter.truncated = true;
    }

    out.push({
      id: idValue(child.id) || `hn-${counter.loaded}`,
      author: stringValue(child.author) || 'anonymous',
      createdAt: timestampValue(child.created_at_i, child.created_at),
      text,
      level,
      children: deeper,
    });
  }

  return out;
}

async function loadHackerNewsComments(
  id: string,
  signal: AbortSignal,
): Promise<CommunityComments> {
  if (!/^\d+$/.test(id)) throw new Error('Invalid Hacker News thread');
  const data = await fetchJson<HnItem>(`${HN_ITEM}/${id}`, signal);
  const counter = { loaded: 0, truncated: false };
  const comments = hnComment(data, 0, counter);
  return {
    comments,
    loaded: counter.loaded,
    truncated: counter.truncated,
  };
}

async function loadLobstersComments(
  id: string,
  signal: AbortSignal,
): Promise<CommunityComments> {
  if (!/^[a-z0-9]+$/i.test(id)) throw new Error('Invalid Lobsters thread');
  const data = await fetchJson<LobstersStoryDetail>(
    `${LOBSTERS_STORY}/${encodeURIComponent(id)}.json`,
    signal,
  );
  const list = Array.isArray(data.comments)
    ? (data.comments as LobstersComment[])
    : [];

  type Node = {
    comment: CommunityComment;
    parentId: string | null;
  };
  const nodes = new Map<string, Node>();
  const order: string[] = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    if (raw.is_deleted === true || raw.is_moderated === true) continue;

    const commentId = stringValue(raw.short_id);
    if (!commentId) continue;

    const text = (
      stringValue(raw.comment_plain) || htmlToText(stringValue(raw.comment))
    ).replace(/\r\n?/g, '\n');
    if (!text) continue;

    nodes.set(commentId, {
      comment: {
        id: commentId,
        author: stringValue(raw.commenting_user) || 'anonymous',
        createdAt: timestampValue(undefined, raw.created_at),
        text,
        level: 0,
        children: [],
      },
      parentId: stringValue(raw.parent_comment) || null,
    });
    order.push(commentId);
  }

  const roots: CommunityComment[] = [];
  for (const commentId of order) {
    const node = nodes.get(commentId);
    if (!node) continue;
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent) parent.comment.children.push(node.comment);
    else roots.push(node.comment);
  }

  const counter = { loaded: 0, truncated: false };
  const walk = (
    comments: CommunityComment[],
    level: number,
  ): CommunityComment[] => {
    const out: CommunityComment[] = [];
    for (const comment of comments) {
      if (counter.loaded >= COMMENT_LIMIT) {
        counter.truncated = true;
        break;
      }
      counter.loaded += 1;
      const children =
        level + 1 <= COMMENT_DEPTH ? walk(comment.children, level + 1) : [];
      if (level + 1 > COMMENT_DEPTH && comment.children.length > 0) {
        counter.truncated = true;
      }
      comment.level = level;
      comment.children = children;
      out.push(comment);
    }
    return out;
  };

  return {
    comments: walk(roots, 0),
    loaded: counter.loaded,
    truncated: counter.truncated,
  };
}

export async function loadCommunityComments(
  thread: CommunityThread,
  options: { signal: AbortSignal; force?: boolean },
): Promise<CommunityComments> {
  const { signal, force = false } = options;
  if (thread.commentsCount === 0) {
    return { comments: [], loaded: 0, truncated: false };
  }

  const key = `comments:${thread.platform}:${thread.id}`;
  if (!force) {
    const cached = readCache(commentCache, key);
    if (cached) return cached;
  }

  const result =
    thread.platform === 'hn'
      ? await loadHackerNewsComments(thread.id, signal)
      : await loadLobstersComments(thread.id, signal);

  if (!signal.aborted) writeCache(commentCache, key, result);
  return result;
}
