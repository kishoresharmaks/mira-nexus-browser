import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { useCatalogConfig } from '@/lib/catalog-provider';
import { normalizeCatalog } from '@/lib/catalog';
import { DiscoveryCache } from './DiscoveryCache';
import {
  DiscoveryRepository,
  type DailyEditorialSlots,
  type ArchiveDay,
} from './DiscoveryRepository';
import type { DiscoveryCategory, DiscoveryItem } from '@/types';

const CATALOG_URL = (process.env.EXPO_PUBLIC_CATALOG_URL ?? '').trim();
const FETCH_TIMEOUT_MS = 6_000;
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

type DiscoveryContextValue = {
  items: DiscoveryItem[];
  categories: DiscoveryCategory[];
  activeFilter: string;
  setActiveFilter: (filterId: string) => void;
  filteredItems: DiscoveryItem[];
  dailySlots: DailyEditorialSlots;
  archive: ArchiveDay[];
  refresh: () => Promise<boolean>;
  refreshing: boolean;
  isOffline: boolean;
  isStale: boolean;
  hasCache: boolean;
  lastSyncAt: number | null;
  error: string | null;
};

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const { todayPages } = useCatalogConfig();

  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasCache, setHasCache] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const syncRemoteFeed = useCallback(
    async (showSpinner = false): Promise<boolean> => {
      if (!CATALOG_URL || inFlight.current) return false;
      inFlight.current = true;
      if (showSpinner) setRefreshing(true);
      setError(null);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const storedETag = await DiscoveryCache.readETag();
        const headers: Record<string, string> = {
          Accept: 'application/json',
        };
        if (storedETag) {
          headers['If-None-Match'] = storedETag;
        }

        const response = await fetch(CATALOG_URL, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        if (!mounted.current) return true;

        // 304 Not Modified: Cache is fresh!
        if (response.status === 304) {
          setIsOffline(false);
          const cached = await DiscoveryCache.readSnapshot();
          if (cached) {
            setLastSyncAt(Date.now());
          }
          return true;
        }

        if (!response.ok) {
          throw new Error(`Catalog server responded with HTTP ${response.status}`);
        }

        const rawJson = await response.json();
        const normalized = normalizeCatalog(rawJson);

        if (!normalized) {
          throw new Error('Remote catalog feed failed validation.');
        }

        const newItems = normalized.pages ?? [];
        const newCategories = normalized.discoveryCategories ?? [];
        const etag = response.headers.get('etag');

        // Atomically write validated snapshot to cache
        await DiscoveryCache.writeSnapshot({
          feedVersion: normalized.version,
          revision: normalized.revision,
          publishedAt: normalized.publishedAt,
          categories: newCategories,
          items: newItems,
          etag,
        });

        if (!mounted.current) return true;

        setItems(newItems);
        setCategories(newCategories);
        setHasCache(true);
        setIsOffline(false);
        setLastSyncAt(Date.now());
        return true;
      } catch (err) {
        if (!mounted.current) return false;
        // On network failure or abort, mark offline but preserve cache
        setIsOffline(true);
        setError(err instanceof Error ? err.message : 'Network sync failed');
        return false;
      } finally {
        clearTimeout(timeout);
        inFlight.current = false;
        if (mounted.current) setRefreshing(false);
      }
    },
    [],
  );

  // Sync with DiscoveryCache on mount
  useEffect(() => {
    let alive = true;

    (async () => {
      const cached = await DiscoveryCache.readSnapshot();
      if (!alive) return;

      if (cached && cached.items) {
        setItems(cached.items);
        setCategories(cached.categories ?? []);
        setHasCache(true);
        setLastSyncAt(cached.lastSyncAt);
      }

      // Check remote feed if URL configured
      if (CATALOG_URL) {
        const isExpired =
          !cached || Date.now() - (cached.fetchedAt || 0) > CACHE_MAX_AGE_MS;
        if (isExpired) {
          void syncRemoteFeed(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [syncRemoteFeed]);

  // When catalog provider gets updated pages, reflect them
  useEffect(() => {
    if (todayPages && todayPages.length > 0) {
      setItems(todayPages);
    }
  }, [todayPages]);

  // Track cache staleness without impure render calculations
  useEffect(() => {
    if (!lastSyncAt) {
      setIsStale(true);
      return;
    }
    const checkStale = () => {
      setIsStale(Date.now() - lastSyncAt > CACHE_MAX_AGE_MS);
    };
    checkStale();
    const interval = setInterval(checkStale, 60_000);
    return () => clearInterval(interval);
  }, [lastSyncAt]);

  // Periodic and foreground re-checks
  useEffect(() => {
    if (!CATALOG_URL) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncRemoteFeed(false);
      }
    });
    return () => subscription.remove();
  }, [syncRemoteFeed]);

  const filteredItems = useMemo(
    () => DiscoveryRepository.filterItems(items, categories, activeFilter),
    [items, categories, activeFilter],
  );

  const dailySlots = useMemo(
    () => DiscoveryRepository.resolveDailySlots(items),
    [items],
  );

  const archive = useMemo(
    () => DiscoveryRepository.resolveArchive(items, 10),
    [items],
  );

  const handleRefresh = useCallback(
    () => syncRemoteFeed(true),
    [syncRemoteFeed],
  );

  const value = useMemo(
    () => ({
      items,
      categories,
      activeFilter,
      setActiveFilter,
      filteredItems,
      dailySlots,
      archive,
      refresh: handleRefresh,
      refreshing,
      isOffline,
      isStale,
      hasCache,
      lastSyncAt,
      error,
    }),
    [
      items,
      categories,
      activeFilter,
      filteredItems,
      dailySlots,
      archive,
      handleRefresh,
      refreshing,
      isOffline,
      isStale,
      hasCache,
      lastSyncAt,
      error,
    ],
  );

  return (
    <DiscoveryContext.Provider value={value}>
      {children}
    </DiscoveryContext.Provider>
  );
}

export function useDiscovery(): DiscoveryContextValue {
  const context = useContext(DiscoveryContext);
  if (!context) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }
  return context;
}
