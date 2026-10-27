import type { HistoryEntry } from '@/types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function clockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export type HistoryGroup = {
  title: string;
  entries: HistoryEntry[];
};

export function groupHistory(
  entries: HistoryEntry[],
  now = Date.now(),
): HistoryGroup[] {
  const today = startOfDay(new Date(now));
  const yesterday = today - DAY;
  const groups: HistoryGroup[] = [
    { title: 'Today', entries: [] },
    { title: 'Yesterday', entries: [] },
    { title: 'Earlier', entries: [] },
  ];

  for (const entry of entries) {
    if (entry.visitedAt >= today) groups[0].entries.push(entry);
    else if (entry.visitedAt >= yesterday) groups[1].entries.push(entry);
    else groups[2].entries.push(entry);
  }

  return groups.filter((group) => group.entries.length > 0);
}
