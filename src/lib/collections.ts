import type { Bookmark, Collection, Shortcut } from '@/types';
import { cleanTitle, createId, hostOf, isWebUrl } from './url';

export const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: 'favorites',
    name: 'Favorites',
    description: 'Frequently visited and pinned websites',
    icon: 'star',
    createdAt: 1700000000000,
    isSystem: true,
  },
  {
    id: 'reading-list',
    name: 'Reading List',
    description: 'Articles and essays saved for later',
    icon: 'book',
    createdAt: 1700000001000,
    isSystem: true,
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Reference docs, whitepapers and data',
    icon: 'folder',
    createdAt: 1700000002000,
  },
  {
    id: 'work',
    name: 'Work',
    description: 'Productivity and workplace tools',
    icon: 'folder',
    createdAt: 1700000003000,
  },
  {
    id: 'inspiration',
    name: 'Inspiration',
    description: 'Design systems, art, and creative spaces',
    icon: 'folder',
    createdAt: 1700000004000,
  },
];

export function normalizeCollections(value: unknown): Collection[] {
  if (!Array.isArray(value)) return DEFAULT_COLLECTIONS;

  const collections: Collection[] = [];
  const seenIds = new Set<string>();

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<Collection>;
    if (typeof item.id !== 'string' || !item.id.trim()) continue;
    if (typeof item.name !== 'string' || !item.name.trim()) continue;

    const id = item.id.trim().slice(0, 80);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    collections.push({
      id,
      name: item.name.trim().slice(0, 100),
      description: typeof item.description === 'string' ? item.description.slice(0, 240) : undefined,
      icon: typeof item.icon === 'string' ? item.icon.slice(0, 40) : 'folder',
      createdAt: typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
      isSystem: Boolean(item.isSystem),
    });
  }

  // Ensure default system collections exist
  for (const def of DEFAULT_COLLECTIONS) {
    if (!seenIds.has(def.id) && def.isSystem) {
      collections.unshift(def);
      seenIds.add(def.id);
    }
  }

  return collections.length > 0 ? collections : DEFAULT_COLLECTIONS;
}

export function normalizeBookmarks(value: unknown): Bookmark[] {
  if (!Array.isArray(value)) return [];

  const bookmarks: Bookmark[] = [];
  const seenUrls = new Set<string>();

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<Bookmark>;
    if (typeof item.url !== 'string' || !isWebUrl(item.url)) continue;

    const url = item.url.trim().slice(0, 4096);
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    bookmarks.push({
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim().slice(0, 80) : `bm-${createId()}`,
      url,
      title: cleanTitle(typeof item.title === 'string' ? item.title : '', url),
      host: hostOf(url),
      collectionId: typeof item.collectionId === 'string' && item.collectionId.trim() ? item.collectionId.trim().slice(0, 80) : 'favorites',
      description: typeof item.description === 'string' ? item.description.slice(0, 500) : undefined,
      notes: typeof item.notes === 'string' ? item.notes.slice(0, 2000) : undefined,
      createdAt: typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
    });
  }

  return bookmarks;
}

export function createBookmark(
  url: string,
  title: string,
  collectionId = 'favorites',
  description?: string,
  notes?: string,
): Bookmark {
  const clean = cleanTitle(title, url);
  return {
    id: `bm-${createId()}`,
    url: url.trim(),
    title: clean,
    host: hostOf(url),
    collectionId: collectionId.trim() || 'favorites',
    description: description?.trim() || undefined,
    notes: notes?.trim() || undefined,
    createdAt: Date.now(),
  };
}

export function findDuplicateBookmark(
  bookmarks: Bookmark[],
  url: string,
  excludeId?: string,
): Bookmark | undefined {
  const target = url.trim().toLowerCase().replace(/\/+$/, '');
  return bookmarks.find((b) => {
    if (excludeId && b.id === excludeId) return false;
    const existing = b.url.trim().toLowerCase().replace(/\/+$/, '');
    return existing === target;
  });
}

/**
 * Migrates existing shortcuts into the Favorites bookmark collection on first setup
 * without modifying or deleting the user's shortcuts array.
 */
export function syncShortcutsToBookmarks(
  shortcuts: Shortcut[],
  currentBookmarks: Bookmark[],
): Bookmark[] {
  const existingUrls = new Set(currentBookmarks.map((b) => b.url.trim().toLowerCase().replace(/\/+$/, '')));
  const migrated: Bookmark[] = [];

  for (const s of shortcuts) {
    const norm = s.url.trim().toLowerCase().replace(/\/+$/, '');
    if (!existingUrls.has(norm)) {
      migrated.push({
        id: `bm-${createId()}`,
        url: s.url,
        title: s.title || s.host,
        host: s.host || hostOf(s.url),
        collectionId: 'favorites',
        createdAt: Date.now(),
      });
      existingUrls.add(norm);
    }
  }

  return [...currentBookmarks, ...migrated];
}

export function exportBookmarksJson(
  collections: Collection[],
  bookmarks: Bookmark[],
): string {
  return JSON.stringify(
    {
      version: 1,
      source: 'Nexus Browser V2',
      exportedAt: new Date().toISOString(),
      collections,
      bookmarks,
    },
    null,
    2,
  );
}

export function exportBookmarksHtml(
  collections: Collection[],
  bookmarks: Bookmark[],
): string {
  const collectionMap = new Map<string, Bookmark[]>();
  for (const c of collections) {
    collectionMap.set(c.id, []);
  }
  for (const b of bookmarks) {
    const list = collectionMap.get(b.collectionId) || [];
    list.push(b);
    collectionMap.set(b.collectionId, list);
  }

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Nexus Bookmarks</TITLE>
<H1>Nexus Bookmarks</H1>
<DL><p>
`;

  for (const c of collections) {
    const list = collectionMap.get(c.id) || [];
    html += `    <DT><H3 ADD_DATE="${Math.floor(c.createdAt / 1000)}">${escapeHtml(c.name)}</H3>\n    <DL><p>\n`;
    for (const b of list) {
      html += `        <DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${Math.floor(b.createdAt / 1000)}">${escapeHtml(b.title)}</A>\n`;
      if (b.description || b.notes) {
        html += `        <DD>${escapeHtml(b.description || b.notes || '')}\n`;
      }
    }
    html += `    </DL><p>\n`;
  }

  html += `</DL><p>\n`;
  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseImportedBookmarksJson(
  raw: string,
): { collections: Collection[]; bookmarks: Bookmark[] } | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const collections = normalizeCollections(parsed.collections);
    const bookmarks = normalizeBookmarks(parsed.bookmarks);
    return { collections, bookmarks };
  } catch {
    return null;
  }
}
