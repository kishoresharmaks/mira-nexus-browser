import type { Shortcut } from '@/types';
import { cleanTitle, createId, hostOf, isWebUrl } from './url';

export const SHORTCUT_LIMIT = 12;

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'wikipedia',
    title: 'Wikipedia',
    url: 'https://www.wikipedia.org/',
    host: 'wikipedia.org',
  },
  {
    id: 'github',
    title: 'GitHub',
    url: 'https://github.com/',
    host: 'github.com',
  },
  {
    id: 'hacker-news',
    title: 'Hacker News',
    url: 'https://news.ycombinator.com/',
    host: 'news.ycombinator.com',
  },
  {
    id: 'youtube',
    title: 'YouTube',
    url: 'https://www.youtube.com/',
    host: 'youtube.com',
  },
  {
    id: 'are-na',
    title: 'Are.na',
    url: 'https://www.are.na/',
    host: 'are.na',
  },
  {
    id: 'dribbble',
    title: 'Dribbble',
    url: 'https://dribbble.com/',
    host: 'dribbble.com',
  },
  {
    id: 'reddit',
    title: 'Reddit',
    url: 'https://www.reddit.com/',
    host: 'reddit.com',
  },
  {
    id: 'archive',
    title: 'Archive',
    url: 'https://archive.org/',
    host: 'archive.org',
  },
];

export function shortcutFromPage(title: string, url: string): Shortcut {
  return {
    id: `shortcut-${createId()}`,
    title: cleanTitle(title, url),
    url,
    host: hostOf(url),
  };
}

/**
 * Shortcuts can be written by an older build or edited on disk. Keep only
 * normal web URLs and rebuild the derived host so a stored host can never be
 * shown as a trusted label for a different site.
 */
export function normalizeShortcuts(value: unknown): Shortcut[] {
  if (!Array.isArray(value)) return DEFAULT_SHORTCUTS;

  const seen = new Set<string>();
  const shortcuts: Shortcut[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<Shortcut>;
    if (typeof item.url !== 'string' || !isWebUrl(item.url)) continue;
    const url = item.url.slice(0, 4_096);
    try {
      const parsed = new URL(url);
      if (!parsed.hostname || parsed.username || parsed.password) continue;
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);

    shortcuts.push({
      id:
        typeof item.id === 'string' && item.id.length > 0
          ? item.id.slice(0, 120)
          : `shortcut-${createId()}`,
      title: cleanTitle(
        typeof item.title === 'string' ? item.title : '',
        url,
      ),
      url,
      host: hostOf(url),
    });

    if (shortcuts.length >= SHORTCUT_LIMIT) break;
  }

  return shortcuts;
}
