import { BUNDLED_CATALOG } from './catalog';
import type { CuratedPage } from '@/types';

const DAY_MS = 86_400_000;
export const TODAY_ARCHIVE_DAYS = 10;

/**
 * The bundled copy of the editorial list. A published admin catalog can replace
 * it at runtime, but the app always has this shelf when the network is absent.
 */
export const CURATED_PAGES: CuratedPage[] = BUNDLED_CATALOG.pages;

/** A stable serial for a local calendar date, independent of DST shifts. */
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

function usablePages(pages: CuratedPage[]): CuratedPage[] {
  return pages.length > 0 ? pages : CURATED_PAGES;
}

function pageForSerial(serial: number, pages: CuratedPage[]): CuratedPage {
  const shelf = usablePages(pages);
  const index = ((serial % shelf.length) + shelf.length) % shelf.length;
  return shelf[index];
}

export function getDailyPage(
  date = new Date(),
  pages: CuratedPage[] = CURATED_PAGES,
): CuratedPage {
  return pageForSerial(daySerial(date), pages);
}

export function curatedDateLabel(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function curatedShortDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export type CuratedDay = {
  page: CuratedPage;
  date: Date;
  label: string;
  offset: number;
};

export function getCuratedArchive(
  count = TODAY_ARCHIVE_DAYS,
  from = new Date(),
  pages: CuratedPage[] = CURATED_PAGES,
): CuratedDay[] {
  return Array.from({ length: count }, (_, offset) => {
    const date = atOffset(from, offset);
    return {
      page: pageForSerial(daySerial(date), pages),
      date,
      label:
        offset === 0
          ? 'Today'
          : offset === 1
            ? 'Yesterday'
            : curatedShortDate(date),
      offset,
    };
  });
}
