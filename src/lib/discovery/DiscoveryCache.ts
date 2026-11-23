import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { DiscoveryCategory, DiscoveryItem } from '@/types';

export type DiscoverySnapshot = {
  feedVersion: number;
  revision: number;
  publishedAt: string;
  categories: DiscoveryCategory[];
  items: DiscoveryItem[];
  etag: string | null;
  fetchedAt: number;
  lastSyncAt: number;
};

const STAGING_KEY = `${STORAGE_KEYS.discoverySnapshot}.staging`;

export class DiscoveryCache {
  /**
   * Reads and parses the active cached discovery snapshot.
   * If parsing fails or data is corrupted, returns null without crashing.
   */
  static async readSnapshot(): Promise<DiscoverySnapshot | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.discoverySnapshot);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!DiscoveryCache.isValidSnapshot(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Safely and atomically writes a new discovery snapshot.
   * Staged and validated before replacing the active snapshot key.
   * If validation or write fails, the previous snapshot remains intact.
   */
  static async writeSnapshot(
    snapshot: Omit<DiscoverySnapshot, 'fetchedAt' | 'lastSyncAt'>,
  ): Promise<boolean> {
    try {
      const now = Date.now();
      const completeSnapshot: DiscoverySnapshot = {
        ...snapshot,
        fetchedAt: now,
        lastSyncAt: now,
      };

      if (!DiscoveryCache.isValidSnapshot(completeSnapshot)) {
        return false;
      }

      const serialized = JSON.stringify(completeSnapshot);

      // Staging write to ensure serializability and storage stability
      await AsyncStorage.setItem(STAGING_KEY, serialized);

      // Commit to primary snapshot key
      await AsyncStorage.setItem(STORAGE_KEYS.discoverySnapshot, serialized);

      // Clean up staging
      await AsyncStorage.removeItem(STAGING_KEY).catch(() => {});

      // Update cached ETag if available
      if (snapshot.etag) {
        await AsyncStorage.setItem(STORAGE_KEYS.discoveryETag, snapshot.etag).catch(() => {});
      }

      return true;
    } catch {
      // Clean up staging on error to prevent dangling data
      await AsyncStorage.removeItem(STAGING_KEY).catch(() => {});
      return false;
    }
  }

  /**
   * Reads stored ETag for HTTP If-None-Match conditional requests.
   */
  static async readETag(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.discoveryETag);
    } catch {
      return null;
    }
  }

  /**
   * Structural validator ensuring complete, uncorrupted snapshot payload.
   */
  static isValidSnapshot(data: unknown): data is DiscoverySnapshot {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    const s = data as Record<string, unknown>;

    if (typeof s.revision !== 'number' || s.revision < 0) return false;
    if (typeof s.publishedAt !== 'string') return false;
    if (!Array.isArray(s.categories)) return false;
    if (!Array.isArray(s.items)) return false;

    // Validate that each item has mandatory minimum properties
    for (const item of s.items) {
      if (!item || typeof item !== 'object') return false;
      const it = item as Record<string, unknown>;
      if (!it.id || typeof it.id !== 'string') return false;
      if (!it.title || typeof it.title !== 'string') return false;
      if (!it.url || typeof it.url !== 'string') return false;
    }

    // Validate that categories have mandatory properties
    for (const cat of s.categories) {
      if (!cat || typeof cat !== 'object') return false;
      const c = cat as Record<string, unknown>;
      if (!c.id || typeof c.id !== 'string') return false;
      if (!c.name || typeof c.name !== 'string') return false;
    }

    return true;
  }
}
