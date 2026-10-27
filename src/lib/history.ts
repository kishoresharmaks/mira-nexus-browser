import type { HistoryEntry } from '@/types';
import { cleanTitle, createId, hostOf, isWebUrl } from './url';

export const HISTORY_LIMIT = 100;

const MAX_TIMESTAMP = 4_102_444_800_000; // 2100-01-01, a sanity ceiling.

function validTimestamp(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0 &&
    value < MAX_TIMESTAMP
  );
}

/** Build a history row from a page that has actually finished loading. */
export function historyEntry(
  url: string,
  title: string,
  visitedAt = Date.now(),
): HistoryEntry | null {
  if (!isWebUrl(url)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return null;
  } catch {
    return null;
  }

  return {
    id: `visit-${createId()}`,
    title: cleanTitle(title, url),
    url: url.slice(0, 4_096),
    host: hostOf(url),
    visitedAt,
  };
}

/**
 * History is user-visible and persisted, so treat the stored array as hostile:
 * drop non-web URLs, credentials, impossible dates, and duplicates.
 */
export function normalizeHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const entries: HistoryEntry[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<HistoryEntry>;
    if (typeof item.url !== 'string' || !isWebUrl(item.url)) continue;
    if (!validTimestamp(item.visitedAt)) continue;
    const url = item.url.slice(0, 4_096);
    try {
      const parsed = new URL(url);
      if (!parsed.hostname || parsed.username || parsed.password) continue;
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);

    entries.push({
      id:
        typeof item.id === 'string' && item.id.length > 0
          ? item.id.slice(0, 120)
          : `visit-${createId()}`,
      title: cleanTitle(
        typeof item.title === 'string' ? item.title : '',
        url,
      ),
      url,
      host: hostOf(url),
      visitedAt: item.visitedAt,
    });
  }

  return entries
    .sort((a, b) => b.visitedAt - a.visitedAt)
    .slice(0, HISTORY_LIMIT);
}
