import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { DownloadItem } from '@/types';
import { createId, isWebUrl } from './url';

const DOWNLOAD_DIR = `${FileSystem.documentDirectory ?? ''}downloads/`;

const activeDownloadTasks = new Map<string, FileSystem.DownloadResumable>();

export function normalizeDownloads(value: unknown): DownloadItem[] {
  if (!Array.isArray(value)) return [];

  const items: DownloadItem[] = [];
  const seenIds = new Set<string>();

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<DownloadItem>;
    if (typeof item.id !== 'string' || !item.id.trim()) continue;
    if (typeof item.url !== 'string' || !isWebUrl(item.url)) continue;

    const id = item.id.trim().slice(0, 80);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    items.push({
      id,
      url: item.url.slice(0, 4096),
      filename: typeof item.filename === 'string' && item.filename.trim() ? item.filename.slice(0, 255) : 'download',
      fileUri: typeof item.fileUri === 'string' ? item.fileUri : '',
      fileSize: typeof item.fileSize === 'number' && Number.isFinite(item.fileSize) ? item.fileSize : 0,
      mimeType: typeof item.mimeType === 'string' ? item.mimeType.slice(0, 100) : undefined,
      progress: typeof item.progress === 'number' && Number.isFinite(item.progress) ? Math.min(1, Math.max(0, item.progress)) : 1,
      status: item.status === 'downloading' ? 'failed' : (item.status === 'completed' || item.status === 'cancelled' ? item.status : 'failed'),
      error: typeof item.error === 'string' ? item.error.slice(0, 300) : undefined,
      startedAt: typeof item.startedAt === 'number' && Number.isFinite(item.startedAt) ? item.startedAt : Date.now(),
      completedAt: typeof item.completedAt === 'number' && Number.isFinite(item.completedAt) ? item.completedAt : undefined,
    });
  }

  return items.sort((a, b) => b.startedAt - a.startedAt);
}

export function getFilenameFromUrl(url: string, suggested?: string): string {
  if (suggested && suggested.trim()) {
    return sanitizeFilename(suggested.trim());
  }

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.includes('.')) {
      return sanitizeFilename(decodeURIComponent(last));
    }
  } catch {
    // fallback
  }

  return `download-${Date.now().toString(36)}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 120);
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export async function ensureDownloadDirectory(): Promise<string> {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
  return DOWNLOAD_DIR;
}

export type DownloadProgressHandler = (id: string, progress: number, bytesWritten: number, totalBytes: number) => void;
export type DownloadCompleteHandler = (item: DownloadItem) => void;
export type DownloadErrorHandler = (id: string, error: string) => void;

/**
 * Initiates an actual background file download to app's sandboxed documentDirectory.
 * Requires zero broad storage permissions on Android.
 */
export async function startFileDownload(
  url: string,
  suggestedName: string | undefined,
  callbacks: {
    onProgress: DownloadProgressHandler;
    onComplete: DownloadCompleteHandler;
    onError: DownloadErrorHandler;
  },
): Promise<DownloadItem> {
  const id = `dl-${createId()}`;
  const filename = getFilenameFromUrl(url, suggestedName);
  await ensureDownloadDirectory();
  const fileUri = `${DOWNLOAD_DIR}${filename}`;

  const downloadItem: DownloadItem = {
    id,
    url,
    filename,
    fileUri,
    fileSize: 0,
    progress: 0,
    status: 'downloading',
    startedAt: Date.now(),
  };

  const progressCallback = (data: FileSystem.DownloadProgressData) => {
    const total = data.totalBytesExpectedToWrite;
    const written = data.totalBytesWritten;
    const progress = total > 0 ? Math.min(1, Math.max(0, written / total)) : 0.5;
    callbacks.onProgress(id, progress, written, total);
  };

  const task = FileSystem.createDownloadResumable(url, fileUri, {}, progressCallback);
  activeDownloadTasks.set(id, task);

  task
    .downloadAsync()
    .then((result) => {
      activeDownloadTasks.delete(id);
      if (result && result.status >= 200 && result.status < 300) {
        // Fetch file size
        FileSystem.getInfoAsync(fileUri).then((info) => {
          const finalItem: DownloadItem = {
            ...downloadItem,
            fileSize: info.exists && 'size' in info ? (info.size ?? 0) : 0,
            progress: 1,
            status: 'completed',
            mimeType: result.mimeType ?? undefined,
            completedAt: Date.now(),
          };
          callbacks.onComplete(finalItem);
        });
      } else {
        callbacks.onError(id, `Download failed with HTTP ${result?.status ?? 'unknown'}`);
      }
    })
    .catch((err: unknown) => {
      activeDownloadTasks.delete(id);
      const msg = err instanceof Error ? err.message : 'Network error during download';
      callbacks.onError(id, msg);
    });

  return downloadItem;
}

export async function cancelFileDownload(id: string): Promise<boolean> {
  const task = activeDownloadTasks.get(id);
  if (task) {
    try {
      await task.pauseAsync();
    } catch {
      // Ignore pause failure
    }
    activeDownloadTasks.delete(id);
    return true;
  }
  return false;
}

export async function openDownloadedFile(item: DownloadItem): Promise<boolean> {
  try {
    const exists = await FileSystem.getInfoAsync(item.fileUri);
    if (!exists.exists) return false;

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(item.fileUri, {
        mimeType: item.mimeType,
        dialogTitle: `Open ${item.filename}`,
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function deleteDownloadedFile(item: DownloadItem): Promise<boolean> {
  try {
    await cancelFileDownload(item.id);
    await FileSystem.deleteAsync(item.fileUri, { idempotent: true });
    return true;
  } catch {
    return false;
  }
}
