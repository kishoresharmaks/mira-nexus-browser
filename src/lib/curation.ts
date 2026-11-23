import type { CuratedPage } from '@/types';

const DAY_MS = 86_400_000;
export const TODAY_ARCHIVE_DAYS = 10;

/** A stable serial for a local calendar date, independent of DST shifts. */
export function daySerial(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS,
  );
}

export function atOffset(from: Date, offset: number): Date {
  return new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() - offset,
    12,
  );
}

export function pageForSerial(
  serial: number,
  pages: CuratedPage[],
): CuratedPage | null {
  if (!pages || pages.length === 0) return null;
  const index = ((serial % pages.length) + pages.length) % pages.length;
  return pages[index] ?? null;
}

export function getDailyPage(
  date = new Date(),
  pages: CuratedPage[] = [],
): CuratedPage | null {
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
  page: CuratedPage | null;
  date: Date;
  label: string;
  offset: number;
};

export function getCuratedArchive(
  count = TODAY_ARCHIVE_DAYS,
  from = new Date(),
  pages: CuratedPage[] = [],
): CuratedDay[] {
  if (!pages || pages.length === 0) return [];
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
