import {
  BUNDLED_CATALOG,
  DEFAULT_SEARCH_ENGINE,
  buildSearchUrl,
  searchMatchFromUrl,
  type SearchEngine,
} from './catalog';
import type { InputTarget } from '@/types';

export { searchMatchFromUrl, searchQueryFromUrl } from './catalog';

export const SEARCH_ENDPOINT = DEFAULT_SEARCH_ENGINE.searchUrl;

const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const DOMAIN =
  /^(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}|localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d{1,5})?(?:[/?#].*)?$/i;
const PRIVATE_HOST =
  /^(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d{1,5})?$/i;
const PRIVATE_HOSTNAME =
  /^(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|\[?::1\]?|.+\.local)$/i;

export function isPrivateHostname(hostname: string): boolean {
  return PRIVATE_HOSTNAME.test(hostname);
}

export function toSearchUrl(
  query: string,
  engine: SearchEngine = DEFAULT_SEARCH_ENGINE,
): string {
  return buildSearchUrl(query, engine);
}

export function resolveInput(
  raw: string,
  engine: SearchEngine = DEFAULT_SEARCH_ENGINE,
): InputTarget | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (!parsed.hostname) return null;
      if (parsed.username || parsed.password) return null;
      const secure = toSecureHttps(parsed.toString());
      const url = secure ?? parsed.toString();
      return {
        url,
        kind: 'url',
        host: displayHost(parsed.hostname),
      };
    } catch {
      return null;
    }
  }

  if (DOMAIN.test(value)) {
    const authority = value.split(/[/?#]/, 1)[0] ?? value;
    const scheme = PRIVATE_HOST.test(authority) ? 'http' : 'https';
    const candidate = `${scheme}://${value}`;
    try {
      const parsed = new URL(candidate);
      return {
        url: parsed.toString(),
        kind: 'url',
        host: displayHost(parsed.hostname),
      };
    } catch {
      return null;
    }
  }

  if (URL_SCHEME.test(value) && !value.includes(' ')) {
    // Unknown or non-web schemes are safer as a search than as arbitrary navigation.
    return { url: toSearchUrl(value, engine), kind: 'search', host: engine.name };
  }

  return { url: toSearchUrl(value, engine), kind: 'search', host: engine.name };
}

export function hostOf(url: string): string {
  try {
    return displayHost(new URL(url).hostname);
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] ?? '';
  }
}

export function displayHost(hostname: string): string {
  return hostname.replace(/^www\./i, '');
}

export function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Nexus is HTTPS-only in production: Android cleartext traffic and iOS ATS are
 * both disabled. Upgrade a public http URL so a pasted or shared link still
 * has a path to load. Private hosts keep their explicit scheme because the
 * local development server will never have a valid certificate.
 */
export function toSecureHttps(url: string): string | null {
  if (!isWebUrl(url)) return null;
  try {
    // React Native's URL polyfill matches the scheme case-sensitively in its
    // `pathname` getter and has read-only `protocol`/`port` accessors. Normalise
    // the scheme up front, then rebuild the secure form instead of mutating it.
    const normalized = url.replace(
      /^([a-z][a-z0-9+.-]*):/i,
      (_, scheme: string) => `${scheme.toLowerCase()}:`,
    );
    const parsed = new URL(normalized);
    if (!parsed.hostname) return null;
    if (parsed.username || parsed.password) return null;

    if (parsed.protocol === 'https:') return parsed.toString();
    if (parsed.protocol !== 'http:') return null;
    if (isPrivateHostname(parsed.hostname)) return null;

    const authority =
      normalized.match(/^https?:\/\/([^/?#]+)/i)?.[1] ?? parsed.hostname;
    const secureAuthority = authority.replace(/:80$/i, '');
    return `https://${secureAuthority}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export type DisplayUrl = {
  host: string;
  path: string;
  secure: boolean;
};

export function getDisplayUrl(
  url: string,
  engines: SearchEngine[] = BUNDLED_CATALOG.engines,
): DisplayUrl {
  if (!url || url === 'about:blank') {
    return { host: 'New page', path: '', secure: true };
  }

  const match = searchMatchFromUrl(url, engines);
  if (match) {
    return {
      host: match.engine.name,
      path: `“${match.query}”`,
      secure: true,
    };
  }

  try {
    const parsed = new URL(url);
    let path = `${parsed.pathname}${parsed.search}`;
    if (path === '/') path = '';
    try {
      path = decodeURI(path);
    } catch {
      // Keep the encoded path if it cannot be decoded.
    }
    if (path.length > 44) path = `${path.slice(0, 43)}…`;
    return {
      host: displayHost(parsed.hostname) || 'New page',
      path,
      secure: parsed.protocol === 'https:',
    };
  } catch {
    return { host: url, path: '', secure: false };
  }
}

/**
 * Ask the site for its own favicon instead of leaking every visited hostname to
 * a third-party icon service. Sites without /favicon.ico fall back to a drawn
 * initial in `Favicon`.
 */
export function faviconUrl(host: string): string {
  const clean = host.trim().toLowerCase().replace(/^www\./i, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(clean)) return '';
  return `https://${clean}/favicon.ico`;
}

export function cleanTitle(title: string | undefined | null, url: string): string {
  const trimmed = (title ?? '').trim();
  if (!trimmed || isWebUrl(trimmed)) return hostOf(url);
  return trimmed.length > 90 ? `${trimmed.slice(0, 89)}…` : trimmed;
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
