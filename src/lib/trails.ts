import type { HistoryEntry, Trail, TrailPage } from '@/types';
import { cleanTitle, createId, hostOf, isWebUrl } from './url';
import { TRAIL_GAP_MINUTES } from './storage-keys';

export const TRAIL_GAP_MS = TRAIL_GAP_MINUTES * 60_000;
export const TRAIL_LIMIT = 30;
export const TRAIL_PAGE_LIMIT = 40;

const MAX_TIMESTAMP = 4_102_444_800_000; // 2100-01-01, a sanity ceiling.

export function trailFromHistory(entry: HistoryEntry): TrailPage {
  return {
    id: entry.id,
    title: entry.title,
    url: entry.url,
    host: entry.host,
    visitedAt: entry.visitedAt,
  };
}

/**
 * Add one visit to the newest trail when it is less than the trail gap away.
 * Revisiting the page already at the end of the trail extends its time without
 * adding a duplicate dot. A reload after a long pause begins a new trail.
 */
export function appendTrailVisit(
  trails: Trail[],
  page: TrailPage,
  now = Date.now(),
): Trail[] {
  const latest = trails[0];
  const withinGap = latest ? now - latest.endedAt <= TRAIL_GAP_MS : false;

  if (latest && withinGap) {
    const lastPage = latest.pages[latest.pages.length - 1];
    const pages =
      lastPage?.url === page.url
        ? latest.pages
        : [...latest.pages, page].slice(-TRAIL_PAGE_LIMIT);

    return [
      {
        ...latest,
        endedAt: Math.max(latest.endedAt, now),
        pages,
      },
      ...trails.slice(1),
    ];
  }

  const fresh: Trail = {
    id: `trail-${createId()}`,
    startedAt: now,
    endedAt: now,
    pages: [page],
  };

  return [fresh, ...trails].slice(0, TRAIL_LIMIT);
}

export function generatedTrailTitle(startedAt: number): string {
  const date = new Date(startedAt);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const hour = date.getHours();
  const part =
    hour < 5
      ? 'late night'
      : hour < 12
        ? 'morning'
        : hour < 17
          ? 'afternoon'
          : hour < 21
            ? 'evening'
            : 'night';
  return `${weekday} ${part}`;
}

export function trailTitle(trail: Trail): string {
  const custom = trail.name?.trim();
  return custom || generatedTrailTitle(trail.startedAt);
}

export function trailDateLabel(trail: Trail): string {
  const date = new Date(trail.startedAt);
  const includeYear = date.getFullYear() !== new Date().getFullYear();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' as const } : null),
  });
}

export function trailTimeRange(trail: Trail): string {
  const start = new Date(trail.startedAt);
  const end = new Date(trail.endedAt);
  const time = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${time(start)} – ${time(end)}`;
}

export function trailDurationLabel(trail: Trail): string {
  const minutes = Math.round((trail.endedAt - trail.startedAt) / 60_000);
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function trailPageLabel(count: number): string {
  return count === 1 ? '1 page' : `${count} pages`;
}

function validTimestamp(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0 &&
    value < MAX_TIMESTAMP
  );
}

function normalizePage(value: unknown): TrailPage | null {
  if (!value || typeof value !== 'object') return null;
  const page = value as Partial<TrailPage>;
  if (typeof page.url !== 'string' || !isWebUrl(page.url)) return null;
  if (!validTimestamp(page.visitedAt)) return null;

  const url = page.url.slice(0, 4_096);
  const title = cleanTitle(
    typeof page.title === 'string' ? page.title : '',
    url,
  );
  return {
    id:
      typeof page.id === 'string' && page.id.length > 0
        ? page.id.slice(0, 120)
        : createId(),
    title,
    url,
    host:
      typeof page.host === 'string' && page.host.length > 0
        ? page.host.slice(0, 120)
        : hostOf(url),
    visitedAt: page.visitedAt,
  };
}

/**
 * Storage is untrusted input: a previous version, a corrupted write, or a
 * manual edit should never be able to crash the home screen.
 */
export function normalizeTrails(value: unknown): Trail[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const trails: Trail[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const trail = raw as Partial<Trail>;
    if (!Array.isArray(trail.pages)) continue;

    const pages = trail.pages
      .map(normalizePage)
      .filter((page): page is TrailPage => page !== null)
      .slice(-TRAIL_PAGE_LIMIT);
    if (pages.length === 0) continue;

    const id =
      typeof trail.id === 'string' && trail.id.length > 0
        ? trail.id.slice(0, 120)
        : `trail-${createId()}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const times = pages.map((page) => page.visitedAt);
    const startedAt = validTimestamp(trail.startedAt)
      ? Math.min(trail.startedAt, ...times)
      : Math.min(...times);
    const endedAt = validTimestamp(trail.endedAt)
      ? Math.max(trail.endedAt, ...times)
      : Math.max(...times);
    const name =
      typeof trail.name === 'string'
        ? trail.name.trim().slice(0, 48) || undefined
        : undefined;

    trails.push({
      id,
      startedAt,
      endedAt: Math.max(startedAt, endedAt),
      pages,
      ...(name ? { name } : null),
    });
  }

  return trails
    .sort((a, b) => b.endedAt - a.endedAt)
    .slice(0, TRAIL_LIMIT);
}
