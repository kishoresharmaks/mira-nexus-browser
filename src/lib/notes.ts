import type { WebNote } from '@/types';
import { cleanTitle, createId, hostOf, isWebUrl } from './url';

export function normalizeWebNotes(value: unknown): WebNote[] {
  if (!Array.isArray(value)) return [];

  const notes: WebNote[] = [];
  const seenIds = new Set<string>();

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<WebNote>;
    if (typeof item.id !== 'string' || !item.id.trim()) continue;
    if (typeof item.content !== 'string') continue;

    const id = item.id.trim().slice(0, 80);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const url = typeof item.url === 'string' && isWebUrl(item.url) ? item.url.slice(0, 4096) : '';
    const host = url ? hostOf(url) : (typeof item.host === 'string' ? item.host.slice(0, 120) : '');

    notes.push({
      id,
      url,
      host,
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 200) : 'Untitled Note',
      content: item.content.slice(0, 100_000),
      createdAt: typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
      updatedAt: typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
    });
  }

  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createWebNote(
  title: string,
  content: string,
  url = '',
): WebNote {
  const now = Date.now();
  const validUrl = url && isWebUrl(url) ? url.trim() : '';
  const host = validUrl ? hostOf(validUrl) : '';
  const clean = title.trim() || (validUrl ? `Note on ${host}` : 'Quick Note');

  return {
    id: `note-${createId()}`,
    url: validUrl,
    host,
    title: cleanTitle(clean, validUrl),
    content: content.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function getNotesForUrl(notes: WebNote[], url: string): WebNote[] {
  if (!url || !isWebUrl(url)) return [];
  const normTarget = url.trim().toLowerCase().replace(/\/+$/, '');
  const targetHost = hostOf(url).toLowerCase();

  return notes.filter((n) => {
    if (!n.url) return false;
    const norm = n.url.trim().toLowerCase().replace(/\/+$/, '');
    return norm === normTarget || (n.host && n.host.toLowerCase() === targetHost);
  });
}

export function exportNotesMarkdown(notes: WebNote[]): string {
  let md = `# Nexus Web Notes\n*Exported on ${new Date().toLocaleDateString()}*\n\n`;

  for (const n of notes) {
    md += `## ${n.title}\n`;
    if (n.url) {
      md += `**Source:** [${n.host || n.url}](${n.url})\n`;
    }
    md += `*Updated: ${new Date(n.updatedAt).toLocaleString()}*\n\n`;
    md += `${n.content}\n\n---\n\n`;
  }

  return md;
}
