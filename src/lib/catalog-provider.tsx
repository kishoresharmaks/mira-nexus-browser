import AsyncStorage from '@react-native-async-storage/async-storage';
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
import {
  BUNDLED_CATALOG,
  normalizeCatalog,
  normalizeCustomEngines,
  type AdsConfig,
  type Catalog,
  type SearchCategoriesConfig,
  type SearchCategoryKey,
  type SearchEngine,
  type SearchProvider,
} from '@/lib/catalog';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { usePersistentState } from '@/lib/usePersistentState';

const CATALOG_URL = (process.env.EXPO_PUBLIC_CATALOG_URL ?? '').trim();
/** A published change should reach an active install within the hour. */
const CACHE_MAX_AGE_MS = 60 * 60 * 1000;
const FOREGROUND_RECHECK_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6_000;

type CatalogSource = 'bundled' | 'cache' | 'network';

type SearchState = {
  activeEngineId: string | null;
  customEngines: SearchEngine[];
  selectedCategoryProviders?: Partial<Record<SearchCategoryKey, string>>;
};

const EMPTY_SEARCH_STATE: SearchState = {
  activeEngineId: null,
  customEngines: [],
  selectedCategoryProviders: {},
};

type CatalogContextValue = {
  /** Presets from the published catalog, in the order the admin set. */
  engines: SearchEngine[];
  presetEngines: SearchEngine[];
  customEngines: SearchEngine[];
  activeEngine: SearchEngine;
  todayPages: Catalog['pages'];
  ads: AdsConfig;
  categories: SearchCategoriesConfig;
  activeCategories: SearchCategoryKey[];
  selectedCategoryProviders: Partial<Record<SearchCategoryKey, string>>;
  getCategoryDefaultProvider: (category: SearchCategoryKey) => SearchProvider | null;
  getCategoryActiveProvider: (category: SearchCategoryKey) => SearchProvider | null;
  getCategoryProviders: (category: SearchCategoryKey) => SearchProvider[];
  selectCategoryProvider: (category: SearchCategoryKey, providerId: string) => void;
  /** The cached catalog and saved search choice have been read. */
  hydrated: boolean;
  selectEngine: (id: string) => void;
  addCustomEngine: (engine: SearchEngine) => void;
  removeCustomEngine: (id: string) => void;
  /** Re-fetch the hosted catalog. Resolves false when no endpoint is built in. */
  refreshCatalog: () => Promise<boolean>;
  refreshing: boolean;
  refreshError: boolean;
  source: CatalogSource;
  updatedAt: number | null;
  hasRemoteConfig: boolean;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

function normalizeSearchState(value: unknown): SearchState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return EMPTY_SEARCH_STATE;
  }
  const record = value as Record<string, unknown>;
  const activeEngineId =
    typeof record.activeEngineId === 'string' ? record.activeEngineId : null;
  const selectedCategoryProviders: Partial<Record<SearchCategoryKey, string>> = {};
  if (record.selectedCategoryProviders && typeof record.selectedCategoryProviders === 'object' && !Array.isArray(record.selectedCategoryProviders)) {
    const rawMap = record.selectedCategoryProviders as Record<string, unknown>;
    for (const key of ['web', 'ai', 'images', 'news', 'videos'] as SearchCategoryKey[]) {
      if (typeof rawMap[key] === 'string' && rawMap[key].trim()) {
        selectedCategoryProviders[key] = rawMap[key].trim();
      }
    }
  }
  return {
    activeEngineId,
    customEngines: normalizeCustomEngines(record.customEngines),
    selectedCategoryProviders,
  };
}

async function fetchCatalog(signal: AbortSignal): Promise<Catalog> {
  const response = await fetch(CATALOG_URL, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  const catalog = normalizeCatalog(await response.json());
  if (!catalog) throw new Error('Catalog response was not valid');
  return catalog;
}

type CachedCatalog = {
  catalog: Catalog;
  fetchedAt: number;
};

async function readCachedCatalog(): Promise<CachedCatalog | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.catalog);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const catalog = normalizeCatalog(record.catalog);
    const fetchedAt = Number(record.fetchedAt);
    if (!catalog || !Number.isFinite(fetchedAt)) return null;
    return { catalog, fetchedAt };
  } catch {
    return null;
  }
}

async function writeCachedCatalog(value: CachedCatalog): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.catalog, JSON.stringify(value));
  } catch {
    // A cache write failure must never break the browser.
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [search, setSearch, searchHydrated] = usePersistentState<SearchState>(
    STORAGE_KEYS.search,
    EMPTY_SEARCH_STATE,
    normalizeSearchState,
  );
  const [catalog, setCatalog] = useState<Catalog>(BUNDLED_CATALOG);
  const [source, setSource] = useState<CatalogSource>('bundled');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [cacheHydrated, setCacheHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const updatedAtRef = useRef<number | null>(null);
  const lastForegroundCheck = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    updatedAtRef.current = updatedAt;
  }, [updatedAt]);

  const loadRemote = useCallback(
    async (showSpinner: boolean): Promise<boolean> => {
      if (!CATALOG_URL || inFlight.current) return false;
      inFlight.current = true;
      if (showSpinner) setRefreshing(true);
      setRefreshError(false);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const next = await fetchCatalog(controller.signal);
        if (!mounted.current) return true;
        const fetchedAt = Date.now();
        setCatalog(next);
        setSource('network');
        setUpdatedAt(fetchedAt);
        await writeCachedCatalog({ catalog: next, fetchedAt });
        return true;
      } catch {
        if (mounted.current) setRefreshError(true);
        return false;
      } finally {
        clearTimeout(timeout);
        inFlight.current = false;
        if (mounted.current) setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      const cached = await readCachedCatalog();
      if (!alive) return;

      if (cached) {
        setCatalog(cached.catalog);
        setSource('cache');
        setUpdatedAt(cached.fetchedAt);
      }

      if (!alive) return;
      setCacheHydrated(true);

      if (!CATALOG_URL) return;
      const stale = !cached || Date.now() - cached.fetchedAt > CACHE_MAX_AGE_MS;
      if (stale) await loadRemote(false);
    })().catch(() => {
      // The bundled catalog is already active; a cache read failure is quiet.
      if (alive) setCacheHydrated(true);
    });

    return () => {
      alive = false;
    };
  }, [loadRemote]);

  useEffect(() => {
    if (!CATALOG_URL) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const now = Date.now();
      const last = updatedAtRef.current;
      if (last !== null && now - last < FOREGROUND_RECHECK_MS) return;
      // AppState can emit active more than once in a burst; one check is enough.
      if (now - lastForegroundCheck.current < 30_000) return;
      lastForegroundCheck.current = now;
      void loadRemote(false);
    });
    return () => subscription.remove();
  }, [loadRemote]);

  const engines = useMemo(() => {
    const seen = new Set(catalog.engines.map((engine) => engine.id));
    return [
      ...catalog.engines,
      ...search.customEngines.filter((engine) => !seen.has(engine.id)),
    ];
  }, [catalog.engines, search.customEngines]);

  const activeEngine = useMemo(() => {
    const chosen = engines.find((engine) => engine.id === search.activeEngineId);
    if (chosen) return chosen;
    const presetDefault = engines.find(
      (engine) => engine.id === catalog.defaultEngineId,
    );
    return presetDefault ?? engines[0];
  }, [catalog.defaultEngineId, engines, search.activeEngineId]);

  const selectEngine = useCallback(
    (id: string) => {
      if (!engines.some((engine) => engine.id === id)) return;
      setSearch((previous) => ({ ...previous, activeEngineId: id }));
    },
    [engines, setSearch],
  );

  const addCustomEngine = useCallback(
    (engine: SearchEngine) => {
      setSearch((previous) => ({
        activeEngineId: engine.id,
        customEngines: [
          ...previous.customEngines.filter((item) => item.id !== engine.id),
          engine,
        ].slice(-20),
      }));
    },
    [setSearch],
  );

  const removeCustomEngine = useCallback(
    (id: string) => {
      setSearch((previous) => ({
        activeEngineId:
          previous.activeEngineId === id ? null : previous.activeEngineId,
        customEngines: previous.customEngines.filter(
          (engine) => engine.id !== id,
        ),
      }));
    },
    [setSearch],
  );

  const refreshCatalog = useCallback(
    () => (CATALOG_URL ? loadRemote(true) : Promise.resolve(false)),
    [loadRemote],
  );

  const activeCategories = useMemo<SearchCategoryKey[]>(() => {
    const list: SearchCategoryKey[] = ['web', 'ai', 'images', 'news', 'videos'];
    return list.filter((key) => catalog.categories?.[key]?.enabled !== false);
  }, [catalog.categories]);

  const selectedCategoryProviders = useMemo(
    () => search.selectedCategoryProviders ?? {},
    [search.selectedCategoryProviders],
  );

  const selectCategoryProvider = useCallback(
    (category: SearchCategoryKey, providerId: string) => {
      setSearch((prev) => ({
        ...prev,
        selectedCategoryProviders: {
          ...(prev.selectedCategoryProviders ?? {}),
          [category]: providerId,
        },
      }));
    },
    [setSearch],
  );

  const getCategoryActiveProvider = useCallback(
    (category: SearchCategoryKey): SearchProvider | null => {
      const cat = catalog.categories?.[category];
      if (!cat) return null;
      const providers = cat.providers.filter((p) => p.enabled);
      if (providers.length === 0) return null;

      const userChoice = search.selectedCategoryProviders?.[category];
      if (userChoice) {
        const found = providers.find((p) => p.id === userChoice);
        if (found) return found;
      }

      return (
        providers.find((p) => p.id === cat.defaultProvider) ??
        providers[0] ??
        null
      );
    },
    [catalog.categories, search.selectedCategoryProviders],
  );

  const getCategoryDefaultProvider = useCallback(
    (category: SearchCategoryKey): SearchProvider | null => {
      const cat = catalog.categories?.[category];
      if (!cat) return null;
      const providers = cat.providers.filter((p) => p.enabled);
      return (
        providers.find((p) => p.id === cat.defaultProvider) ??
        providers[0] ??
        null
      );
    },
    [catalog.categories],
  );

  const getCategoryProviders = useCallback(
    (category: SearchCategoryKey): SearchProvider[] => {
      const cat = catalog.categories?.[category];
      if (!cat) return [];
      return cat.providers.filter((p) => p.enabled);
    },
    [catalog.categories],
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      engines,
      presetEngines: catalog.engines,
      customEngines: search.customEngines,
      activeEngine,
      todayPages: catalog.pages,
      ads: catalog.ads,
      categories: catalog.categories,
      activeCategories,
      selectedCategoryProviders,
      getCategoryDefaultProvider,
      getCategoryActiveProvider,
      getCategoryProviders,
      selectCategoryProvider,
      hydrated: cacheHydrated && searchHydrated,
      selectEngine,
      addCustomEngine,
      removeCustomEngine,
      refreshCatalog,
      refreshing,
      refreshError,
      source,
      updatedAt,
      hasRemoteConfig: Boolean(CATALOG_URL),
    }),
    [
      activeCategories,
      activeEngine,
      addCustomEngine,
      catalog.ads,
      catalog.categories,
      catalog.engines,
      catalog.pages,
      cacheHydrated,
      engines,
      getCategoryActiveProvider,
      getCategoryDefaultProvider,
      getCategoryProviders,
      refreshCatalog,
      refreshError,
      refreshing,
      removeCustomEngine,
      search.customEngines,
      searchHydrated,
      selectCategoryProvider,
      selectEngine,
      selectedCategoryProviders,
      source,
      updatedAt,
    ],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalogConfig(): CatalogContextValue {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error('useCatalogConfig must be used inside CatalogProvider');
  }
  return value;
}
