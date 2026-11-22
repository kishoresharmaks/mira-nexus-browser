import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  BackHandler,
  Easing,
  Linking,
  Platform,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShareIntent } from 'expo-share-intent';
import { AddressOverlay } from '@/components/AddressOverlay';
import { AiSummarySheet } from '@/components/AiSummarySheet';
import { AppsSheet } from '@/components/AppsSheet';
import { AudioPlayerBar } from '@/components/AudioPlayerBar';
import { BrowserPane } from '@/components/BrowserPane';
import { BrowserToolbar } from '@/components/BrowserToolbar';
import { CollectionsSheet } from '@/components/CollectionsSheet';
import { CommunitySheet } from '@/components/CommunitySheet';
import { DownloadsSheet } from '@/components/DownloadsSheet';
import { HistorySheet } from '@/components/HistorySheet';
import { HomeScreen } from '@/components/HomeScreen';
import type { SearchCategory } from '@/components/home/SearchCategories';
import { MenuSheet } from '@/components/MenuSheet';
import { NotesSheet } from '@/components/NotesSheet';
import { PrivacySheet } from '@/components/PrivacySheet';
import { PrivateSheet } from '@/components/PrivateSheet';
import { PrivateStart } from '@/components/PrivateStart';
import { PrivateVeil } from '@/components/PrivateVeil';
import { ReaderSheet } from '@/components/ReaderSheet';
import { TabsSheet } from '@/components/TabsSheet';
import { TodaySheet } from '@/components/TodaySheet';
import { TrailsSheet } from '@/components/TrailsSheet';
import { useToast } from '@/components/Toast';
import { speechService } from '@/lib/speech';
import { useCatalogConfig } from '@/lib/catalog-provider';
import {
  canonicalizeArticleUrl,
  invalidateCommunityLookup,
  lookupCommunityThreads,
  normalizeCommunityEnabled,
  shouldLookupCommunity,
  type CommunityLookup,
} from '@/lib/community';
import { CURATED_PAGES, curatedShortDate, getDailyPage } from '@/lib/curation';
import { buildCategorizedSearchUrl } from '@/lib/search-routing';
import { haptic } from '@/lib/haptics';
import {
  HISTORY_LIMIT,
  historyEntry,
  normalizeHistory,
} from '@/lib/history';
import { targetFromDeepLink, targetFromShare } from '@/lib/inbound';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_LIMIT,
  normalizeShortcuts,
  shortcutFromPage,
} from '@/lib/shortcuts';
import { MAX_TABS, STORAGE_KEYS } from '@/lib/storage-keys';
import {
  DEFAULT_COLLECTIONS,
  normalizeBookmarks,
  normalizeCollections,
  syncShortcutsToBookmarks,
} from '@/lib/collections';
import {
  cancelFileDownload,
  deleteDownloadedFile,
  normalizeDownloads,
  openDownloadedFile,
  startFileDownload,
} from '@/lib/downloads';
import { normalizeWebNotes } from '@/lib/notes';
import {
  appendTrailVisit,
  normalizeTrails,
  normalizeTrailsEnabled,
  trailFromHistory,
} from '@/lib/trails';
import {
  cleanTitle,
  createId,
  hostOf,
  isWebUrl,
  resolveInput,
  searchQueryFromUrl,
  toSecureHttps,
} from '@/lib/url';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { useLatest } from '@/lib/useLatest';
import { usePersistentState } from '@/lib/usePersistentState';
import {
  engagePrivateShield,
  releasePrivateShield,
} from '@/lib/privateShield';
import { refreshNexusWidget } from '@/widgets/update-widget';
import { privateTheme } from '@/theme';
import { ThemeScope, useTheme } from '@/theme/ThemeProvider';
import type {
  Bookmark,
  BrowserHandle,
  BrowserTab,
  Collection,
  CuratedPage,
  DownloadItem,
  HistoryEntry,
  PageSnapshot,
  Shortcut,
  Trail,
  WebNote,
} from '@/types';

const EMPTY_PAGE: PageSnapshot = {
  url: '',
  title: '',
  canGoBack: false,
  canGoForward: false,
  loading: false,
};

function createTab(
  url: string,
  title?: string,
  privateTab = false,
): BrowserTab {
  const now = Date.now();
  return {
    id: `tab-${createId()}`,
    initialUrl: url,
    createdAt: now,
    lastActiveAt: now,
    // The WebView mounts the first time the tab is shown. No hidden pages are
    // preloaded, and closing the tab releases the native view.
    mounted: true,
    private: privateTab,
    snapshot: {
      url,
      title: url ? (title ? cleanTitle(title, url) : hostOf(url)) : '',
      canGoBack: false,
      canGoForward: false,
      loading: Boolean(url),
    },
  };
}

export default function Nexus() {
  const { theme, toggleMode } = useTheme();
  const toast = useToast();
  const { activeEngine, engines, todayPages } = useCatalogConfig();

  const [shortcuts, setShortcuts, shortcutsReady] = usePersistentState<
    Shortcut[]
  >(STORAGE_KEYS.shortcuts, DEFAULT_SHORTCUTS, normalizeShortcuts);
  const [history, setHistory, historyReady] = usePersistentState<HistoryEntry[]>(
    STORAGE_KEYS.history,
    [],
    normalizeHistory,
  );
  const [trails, setTrails, trailsReady] = usePersistentState<Trail[]>(
    STORAGE_KEYS.trails,
    [],
    normalizeTrails,
  );
  const [communityEnabled, setCommunityEnabled, communityReady] =
    usePersistentState<boolean>(
      STORAGE_KEYS.community,
      true,
      normalizeCommunityEnabled,
    );
  const [collections, setCollections] = usePersistentState<Collection[]>(
    STORAGE_KEYS.collections,
    DEFAULT_COLLECTIONS,
    normalizeCollections,
  );
  const [bookmarks, setBookmarks] = usePersistentState<Bookmark[]>(
    STORAGE_KEYS.bookmarks,
    [],
    normalizeBookmarks,
  );
  const [downloads, setDownloads] = usePersistentState<DownloadItem[]>(
    STORAGE_KEYS.downloads,
    [],
    normalizeDownloads,
  );
  const [notes, setNotes] = usePersistentState<WebNote[]>(
    STORAGE_KEYS.notes,
    [],
    normalizeWebNotes,
  );
  const [trailsEnabled, setTrailsEnabled] = usePersistentState<boolean>(
    STORAGE_KEYS.trailsEnabled,
    true,
    normalizeTrailsEnabled,
  );

  useEffect(() => {
    if (shortcutsReady && shortcuts.length > 0) {
      setBookmarks((prev) => syncShortcutsToBookmarks(shortcuts, prev));
    }
  }, [shortcutsReady, shortcuts, setBookmarks]);

  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [browserActive, setBrowserActive] = useState(false);

  const insets = useSafeAreaInsets();
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressSeed, setAddressSeed] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tabsOpen, setTabsOpen] = useState(false);
  const [trailsOpen, setTrailsOpen] = useState(false);
  const [todayOpen, setTodayOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [today, setToday] = useState<CuratedPage>(() => getDailyPage());
  const [communityLookup, setCommunityLookup] =
    useState<CommunityLookup | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityNonce, setCommunityNonce] = useState(0);
  const [privateInfoOpen, setPrivateInfoOpen] = useState(false);
  const [addressPrivate, setAddressPrivate] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [appsOpen, setAppsOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('web');

  const shift = useAnimatedValue(0);
  const browserRefs = useRef(new Map<string, BrowserHandle>());
  const tabsRef = useLatest(tabs);
  const activeTabRef = useLatest(activeTabId);
  const browserActiveRef = useLatest(browserActive);
  const shortcutsRef = useLatest(shortcuts);
  const shortcutsReadyRef = useLatest(shortcutsReady);
  const addressNewTabRef = useRef(false);
  const sheetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastShareRef = useRef('');

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;
  const snapshot = activeTab?.snapshot ?? EMPTY_PAGE;
  const privateActive = activeTab?.private ?? false;
  const privateChrome = privateActive && browserActive;
  const privateTabCount = tabs.reduce(
    (count, tab) => (tab.private ? count + 1 : count),
    0,
  );
  const hasPrivateTabs = privateTabCount > 0;
  const normalTabs = tabs.filter((tab) => !tab.private);
  const privateChromeRef = useLatest(privateChrome);
  const pinned = shortcuts.some((item) => item.url === snapshot.url);
  const addressValue = searchQueryFromUrl(snapshot.url, engines) ?? snapshot.url;
  const communityCanonical = canonicalizeArticleUrl(snapshot.url);
  const communityForCurrentPage =
    communityLookup && communityLookup.canonicalUrl === communityCanonical
      ? communityLookup
      : null;
  const communityThreads =
    !snapshot.loading && communityForCurrentPage
      ? communityForCurrentPage.threads
      : [];
  const communityFailed = communityForCurrentPage?.failed ?? false;

  useEffect(
    () => () => {
      if (sheetTimer.current) clearTimeout(sheetTimer.current);
    },
    [],
  );

  const revealBrowser = useCallback(() => {
    setBrowserActive(true);
    setAddressOpen(false);
    setMenuOpen(false);
    setHistoryOpen(false);
    setTabsOpen(false);
    setTrailsOpen(false);
    setTodayOpen(false);
    setCommunityOpen(false);
    setPrivateInfoOpen(false);
    Animated.timing(shift, {
      toValue: 1,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [shift]);

  const goHome = useCallback(() => {
    setBrowserActive(false);
    setAddressOpen(false);
    setMenuOpen(false);
    setHistoryOpen(false);
    setTabsOpen(false);
    setTrailsOpen(false);
    setTodayOpen(false);
    setCommunityOpen(false);
    setPrivateInfoOpen(false);
    Animated.timing(shift, {
      toValue: 0,
      duration: 280,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [shift]);

  const activateTab = useCallback(
    (id: string) => {
      if (!tabsRef.current.some((tab) => tab.id === id)) return;
      setTabs((previous) =>
        previous.map((tab) =>
          tab.id === id
            ? { ...tab, mounted: true, lastActiveAt: Date.now() }
            : tab,
        ),
      );
      setActiveTabId(id);
      setToolbarVisible(true);
      revealBrowser();
    },
    [revealBrowser, tabsRef],
  );

  const insertTab = useCallback(
    (tab: BrowserTab) => {
      const current = tabsRef.current;
      let survivors = current;
      let evicted: BrowserTab | undefined;
      if (current.length >= MAX_TABS) {
        // Five tabs is the whole shelf. Reclaim the tab the user has touched
        // least recently rather than dead-ending the tap.
        const activeId = activeTabRef.current;
        const candidates = current.filter((tab) => tab.id !== activeId);
        const pool = candidates.length > 0 ? candidates : current;
        evicted = [...pool].sort(
          (a, b) => a.lastActiveAt - b.lastActiveAt,
        )[0];
        survivors = current.filter((tab) => tab.id !== evicted?.id);
      }

      setTabs([...survivors, tab]);
      setActiveTabId(tab.id);
      revealBrowser();

      if (evicted) {
        const label =
          hostOf(evicted.snapshot.url || evicted.initialUrl) ||
          (evicted.private ? 'private tab' : 'a tab');
        toast.show(`Closed ${label} to make room`);
      }
    },
    [activeTabRef, revealBrowser, tabsRef, toast],
  );

  const openInNewTab = useCallback(
    (rawUrl: string, title?: string, options?: { private?: boolean }) => {
      const privateTab = options?.private ?? false;
      const url = toSecureHttps(rawUrl) ?? (isWebUrl(rawUrl) ? rawUrl : null);
      if (!url) return;

      const current = tabsRef.current;
      // Never let a page opened from a private tab fall back into the normal
      // shelf (and vice versa). Each room reuses only its own pages.
      const existing = current.find(
        (tab) =>
          tab.private === privateTab &&
          (tab.snapshot.url === url || tab.initialUrl === url),
      );
      if (existing) {
        activateTab(existing.id);
        return;
      }

      insertTab(createTab(url, title, privateTab));
    },
    [activateTab, insertTab, tabsRef],
  );

  /**
   * A private tab starts empty. No WebView, no network request, and no page
   * state exists until the reader chooses a page.
   */
  const openPrivateTab = useCallback(() => {
    haptic.tap();
    const blank = tabsRef.current.find(
      (tab) => tab.private && !tab.snapshot.url,
    );
    if (blank) {
      activateTab(blank.id);
      return;
    }
    insertTab(createTab('', undefined, true));
  }, [activateTab, insertTab, tabsRef]);

  const navigateTab = useCallback(
    (id: string, url: string) => {
      const tab = tabsRef.current.find((item) => item.id === id);
      if (!tab) return;

      const handle = browserRefs.current.get(id);
      if (tab.mounted && handle) {
        handle.load(url);
      } else {
        setTabs((previous) =>
          previous.map((item) =>
            item.id === id
              ? {
                  ...item,
                  initialUrl: url,
                  mounted: true,
                  lastActiveAt: Date.now(),
                  snapshot: {
                    url,
                    title: hostOf(url),
                    canGoBack: false,
                    canGoForward: false,
                    loading: true,
                  },
                }
              : item,
          ),
        );
      }

      setActiveTabId(id);
      setToolbarVisible(true);
      revealBrowser();
    },
    [revealBrowser, tabsRef],
  );

  const openAddress = useCallback(
    (seed = '', newTab = false) => {
      haptic.tap();
      const active = tabsRef.current.find(
        (tab) => tab.id === activeTabRef.current,
      );
      const inPrivateRoom =
        !newTab && browserActiveRef.current && Boolean(active?.private);
      addressNewTabRef.current = newTab;
      setAddressPrivate(inPrivateRoom);
      setAddressSeed(seed);
      setToolbarVisible(true);
      setAddressOpen(true);
    },
    [activeTabRef, browserActiveRef, tabsRef],
  );

  const closeAddress = useCallback(() => {
    addressNewTabRef.current = false;
    setAddressPrivate(false);
    setAddressSeed('');
    setAddressOpen(false);
  }, []);

  const submitAddress = useCallback(
    (raw: string) => {
      let target = resolveInput(raw, activeEngine);
      if (!target) return;

      if (target.kind === 'search' && searchCategory !== 'web') {
        const catUrl = buildCategorizedSearchUrl(
          raw,
          searchCategory,
          activeEngine,
        );
        target = {
          url: catUrl,
          kind: 'search',
          host: activeEngine.name,
        };
      }

      setSearchCategory('web');
      const wantsNewTab =
        addressNewTabRef.current ||
        !browserActiveRef.current ||
        !activeTabRef.current;
      addressNewTabRef.current = false;
      setAddressSeed('');
      setAddressOpen(false);

      if (wantsNewTab || !activeTabRef.current) {
        openInNewTab(target.url);
        return;
      }
      navigateTab(activeTabRef.current, target.url);
    },
    [
      activeEngine,
      activeTabRef,
      browserActiveRef,
      navigateTab,
      openInNewTab,
      searchCategory,
    ],
  );

  const openHistory = useCallback(() => {
    haptic.tap();
    setHistoryOpen(true);
  }, []);

  const openTodayArchive = useCallback(() => {
    haptic.tap();
    setTodayOpen(true);
  }, []);

  const openToday = useCallback(() => {
    haptic.tap();
    openInNewTab(today.url, today.title);
  }, [openInNewTab, today.title, today.url]);

  const openTrails = useCallback(() => {
    haptic.tap();
    setTrailsOpen(true);
  }, []);

  const openTabs = useCallback(() => {
    haptic.tap();
    setToolbarVisible(true);
    setTabsOpen(true);
  }, []);

  const afterMenu = useCallback((action: () => void) => {
    if (sheetTimer.current) clearTimeout(sheetTimer.current);
    sheetTimer.current = setTimeout(action, 280);
  }, []);

  const openPrivateInfo = useCallback(() => {
    haptic.tap();
    setPrivateInfoOpen(true);
  }, []);

  const openSettings = useCallback(() => {
    haptic.tap();
    router.push('/settings');
  }, []);

  const openPrivateInfoAfterMenu = useCallback(() => {
    setMenuOpen(false);
    afterMenu(() => setPrivateInfoOpen(true));
  }, [afterMenu]);

  const openPrivateInfoFromTabs = useCallback(() => {
    setTabsOpen(false);
    afterMenu(() => setPrivateInfoOpen(true));
  }, [afterMenu]);

  const openPrivateTabAfterMenu = useCallback(() => {
    setMenuOpen(false);
    afterMenu(() => openPrivateTab());
  }, [afterMenu, openPrivateTab]);

  const newPrivateTabFromSheet = useCallback(() => {
    setTabsOpen(false);
    afterMenu(() => openPrivateTab());
  }, [afterMenu, openPrivateTab]);

  /**
   * Closing the whole private group destroys every private WebView in one
   * pass. There is no undo shelf because there is no record to undo.
   */
  const closePrivateTabs = useCallback(() => {
    const current = tabsRef.current;
    const privates = current.filter((tab) => tab.private);
    if (privates.length === 0) return;

    haptic.warn();
    privates.forEach((tab) => browserRefs.current.delete(tab.id));

    const remaining = current.filter((tab) => !tab.private);
    const activeWasPrivate = privates.some(
      (tab) => tab.id === activeTabRef.current,
    );
    const next = activeWasPrivate
      ? [...remaining].sort((a, b) => b.lastActiveAt - a.lastActiveAt)[0]
      : undefined;

    setPrivateInfoOpen(false);
    setTabsOpen(false);

    if (remaining.length === 0) {
      setTabs([]);
      setActiveTabId(null);
      goHome();
    } else {
      setTabs(
        next
          ? remaining.map((tab) =>
              tab.id === next.id
                ? { ...tab, lastActiveAt: Date.now() }
                : tab,
            )
          : remaining,
      );
      if (next) setActiveTabId(next.id);
    }

    toast.show(
      privates.length === 1 ? 'Private tab closed' : 'Private tabs closed',
    );
  }, [activeTabRef, goHome, tabsRef, toast]);

  const openHistoryAfterMenu = useCallback(() => {
    setMenuOpen(false);
    afterMenu(() => setHistoryOpen(true));
  }, [afterMenu]);

  const openTabsAfterMenu = useCallback(() => {
    setMenuOpen(false);
    afterMenu(() => setTabsOpen(true));
  }, [afterMenu]);

  const openTrailsAfterMenu = useCallback(() => {
    setMenuOpen(false);
    afterMenu(() => setTrailsOpen(true));
  }, [afterMenu]);

  const openCommunity = useCallback(() => {
    haptic.tap();
    setCommunityOpen(true);
  }, []);

  const openCommunityAfterMenu = useCallback(() => {
    setMenuOpen(false);
    afterMenu(() => setCommunityOpen(true));
  }, [afterMenu]);

  const openReader = useCallback(() => {
    haptic.tap();
    if (activeTabId) {
      browserRefs.current.get(activeTabId)?.extractArticle();
    }
    setReaderOpen(true);
  }, [activeTabId]);

  const openAiSummary = useCallback(() => {
    haptic.tap();
    if (activeTabId) {
      browserRefs.current.get(activeTabId)?.extractArticle();
    }
    setAiSummaryOpen(true);
  }, [activeTabId]);

  const startListen = useCallback(() => {
    haptic.tap();
    const article = snapshot.article;
    if (article && article.text) {
      speechService.start(article.title || snapshot.title, article.text);
      toast.show('Reading aloud...', {
        label: 'Stop',
        onPress: () => speechService.stop(),
      });
    } else {
      if (activeTabId) {
        browserRefs.current.get(activeTabId)?.extractArticle();
      }
      toast.show('No readable article found on this page');
    }
  }, [activeTabId, snapshot.article, snapshot.title, toast]);

  const openReaderAfterMenu = useCallback(() => {
    setMenuOpen(false);
    afterMenu(() => openReader());
  }, [afterMenu, openReader]);

  const openAiSummaryAfterMenu = useCallback(() => {
    setMenuOpen(false);
    afterMenu(() => openAiSummary());
  }, [afterMenu, openAiSummary]);

  const startListenAfterMenu = useCallback(() => {
    setMenuOpen(false);
    afterMenu(() => startListen());
  }, [afterMenu, startListen]);

  const openCommunityThread = useCallback(
    (url: string) => {
      setCommunityOpen(false);
      openInNewTab(url);
    },
    [openInNewTab],
  );

  const retryCommunity = useCallback(() => {
    if (snapshot.url) invalidateCommunityLookup(snapshot.url);
    setCommunityNonce((value) => value + 1);
  }, [snapshot.url]);

  const newTabFromSheet = useCallback(() => {
    setTabsOpen(false);
    // In the private room, "new tab" means another private tab. Leaving the
    // room is an explicit act, never the side effect of a plus button.
    const inPrivateRoom = privateChromeRef.current;
    afterMenu(() => {
      if (inPrivateRoom) openPrivateTab();
      else openAddress('', true);
    });
  }, [afterMenu, openAddress, openPrivateTab, privateChromeRef]);

  const handleSnapshot = useCallback((id: string, next: PageSnapshot) => {
    setTabs((previous) =>
      previous.map((tab) => {
        if (tab.id !== id) return tab;
        const current = tab.snapshot;
        if (
          current.url === next.url &&
          current.title === next.title &&
          current.canGoBack === next.canGoBack &&
          current.canGoForward === next.canGoForward &&
          current.loading === next.loading &&
          current.article === next.article
        ) {
          return tab;
        }
        return { ...tab, snapshot: next };
      }),
    );
  }, []);

  const handleVisit = useCallback(
    (url: string, title: string) => {
      if (!isWebUrl(url) || searchQueryFromUrl(url, engines)) return;
      const entry = historyEntry(url, title);
      if (!entry) return;

      setHistory((previous) =>
        [entry, ...previous.filter((item) => item.url !== url)].slice(
          0,
          HISTORY_LIMIT,
        ),
      );
      if (trailsEnabled) {
        setTrails((previous) =>
          appendTrailVisit(previous, trailFromHistory(entry), entry.visitedAt),
        );
      }
    },
    [engines, setHistory, setTrails, trailsEnabled],
  );

  const closeTab = useCallback(
    (id: string) => {
      const current = tabsRef.current;
      const index = current.findIndex((tab) => tab.id === id);
      if (index === -1) return;

      const remaining = current.filter((tab) => tab.id !== id);
      browserRefs.current.delete(id);

      if (activeTabRef.current !== id) {
        setTabs(remaining);
        return;
      }

      if (remaining.length === 0) {
        setTabs([]);
        setActiveTabId(null);
        goHome();
        return;
      }

      const next = remaining[Math.min(index, remaining.length - 1)];
      setTabs(
        remaining.map((tab) =>
          tab.id === next.id ? { ...tab, lastActiveAt: Date.now() } : tab,
        ),
      );
      setActiveTabId(next.id);
    },
    [activeTabRef, goHome, tabsRef],
  );

  const copyLink = useCallback(async () => {
    if (!snapshot.url) return;
    try {
      await Clipboard.setStringAsync(snapshot.url);
      haptic.success();
      toast.show('Link copied');
    } catch {
      toast.show('The link could not be copied');
    }
  }, [snapshot.url, toast]);

  const shareLink = useCallback(async () => {
    if (!isWebUrl(snapshot.url)) return;
    const url = snapshot.url;
    const title = snapshot.title || hostOf(url);

    if (Platform.OS === 'web') {
      const webNavigator = typeof navigator === 'undefined' ? null : navigator;
      if (webNavigator?.share) {
        try {
          await webNavigator.share({ title, url });
          return;
        } catch {
          return;
        }
      }
      try {
        await Clipboard.setStringAsync(url);
        toast.show('Link copied');
      } catch {
        toast.show('The link could not be shared');
      }
      return;
    }

    try {
      await Share.share({
        title,
        url,
        message: Platform.OS === 'android' ? `${title}\n${url}` : url,
      });
    } catch {
      toast.show('The link could not be shared');
    }
  }, [snapshot.title, snapshot.url, toast]);

  const openExternal = useCallback(() => {
    if (!isWebUrl(snapshot.url)) return;
    if (Platform.OS === 'web') {
      window.open(snapshot.url, '_blank', 'noopener,noreferrer');
      return;
    }
    Linking.openURL(snapshot.url).catch(() => {
      toast.show('This link could not be opened');
    });
  }, [snapshot.url, toast]);

  const togglePin = useCallback(() => {
    const url = snapshot.url;
    if (!isWebUrl(url)) return;

    if (pinned) {
      setShortcuts((previous) => previous.filter((item) => item.url !== url));
      toast.show('Removed from shortcuts');
      return;
    }

    const shortcut = shortcutFromPage(snapshot.title, url);
    setShortcuts((previous) =>
      [shortcut, ...previous.filter((item) => item.url !== url)].slice(
        0,
        SHORTCUT_LIMIT,
      ),
    );
    haptic.success();
    toast.show('Pinned to shortcuts', { label: 'Show', onPress: goHome });
  }, [goHome, pinned, setShortcuts, snapshot.title, snapshot.url, toast]);

  const removeShortcut = useCallback(
    (shortcut: Shortcut) => {
      setShortcuts((previous) =>
        previous.filter((item) => item.url !== shortcut.url),
      );
      toast.show(`${shortcut.title} removed`, {
        label: 'Undo',
        onPress: () => {
          setShortcuts((previous) =>
            previous.some((item) => item.url === shortcut.url)
              ? previous
              : [shortcut, ...previous].slice(0, SHORTCUT_LIMIT),
          );
        },
      });
    },
    [setShortcuts, toast],
  );

  const resetShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
    toast.show('Shortcuts restored');
  }, [setShortcuts, toast]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setTrails([]);
    toast.show('History and trails cleared');
  }, [setHistory, setTrails, toast]);

  const renameTrail = useCallback(
    (id: string, name: string) => {
      const clean = name.trim().slice(0, 48);
      setTrails((previous) =>
        previous.map((trail) => {
          if (trail.id !== id) return trail;
          if (!clean) {
            const { name: _drop, ...rest } = trail;
            return rest;
          }
          return { ...trail, name: clean };
        }),
      );
      toast.show(clean ? 'Trail renamed' : 'Trail name cleared');
    },
    [setTrails, toast],
  );

  const deleteTrail = useCallback(
    (id: string) => {
      setTrails((previous) => previous.filter((trail) => trail.id !== id));
      toast.show('Trail deleted');
    },
    [setTrails, toast],
  );

  const resumeTrail = useCallback(
    (trail: Trail) => {
      if (trail.pages.length === 0) return;
      const count = Math.min(trail.pages.length, MAX_TABS);
      for (let i = 0; i < count; i++) {
        const p = trail.pages[i];
        openInNewTab(p.url, p.title);
      }
      toast.show(`Restored ${count} ${count === 1 ? 'tab' : 'tabs'} from session`);
    },
    [openInNewTab, toast],
  );

  const handleStartDownload = useCallback(
    async (url: string, suggestedFilename?: string) => {
      try {
        toast.show('Starting download...');
        const item = await startFileDownload(url, suggestedFilename, {
          onProgress: (id, progress, written, total) => {
            setDownloads((prev) =>
              prev.map((d) =>
                d.id === id ? { ...d, progress, fileSize: total || written } : d,
              ),
            );
          },
          onComplete: (completedItem) => {
            haptic.success();
            toast.show(`Downloaded ${completedItem.filename}`);
            setDownloads((prev) =>
              prev.map((d) => (d.id === completedItem.id ? completedItem : d)),
            );
          },
          onError: (id, error) => {
            haptic.warn();
            toast.show(`Download failed: ${error}`);
            setDownloads((prev) =>
              prev.map((d) =>
                d.id === id ? { ...d, status: 'failed', error } : d,
              ),
            );
          },
        });
        setDownloads((prev) => [item, ...prev.filter((d) => d.id !== item.id)]);
      } catch {
        toast.show('Failed to initiate download');
      }
    },
    [setDownloads, toast],
  );

  const handleCancelDownload = useCallback(
    async (id: string) => {
      await cancelFileDownload(id);
      setDownloads((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'cancelled' } : d)),
      );
    },
    [setDownloads],
  );

  const handleOpenDownload = useCallback(
    async (item: DownloadItem) => {
      const ok = await openDownloadedFile(item);
      if (!ok) {
        toast.show('Unable to open file. It may have been moved.');
      }
    },
    [toast],
  );

  const handleDeleteDownload = useCallback(
    async (item: DownloadItem) => {
      await deleteDownloadedFile(item);
      setDownloads((prev) => prev.filter((d) => d.id !== item.id));
    },
    [setDownloads],
  );

  const handleClearCompletedDownloads = useCallback(() => {
    setDownloads((prev) => prev.filter((d) => d.status === 'downloading'));
  }, [setDownloads]);

  const handleOpenWindow = useCallback(
    (url: string, title?: string, options?: { private?: boolean }) => {
      openInNewTab(url, title, options);
    },
    [openInNewTab],
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (addressOpen) {
          closeAddress();
          return true;
        }
        if (
          menuOpen ||
          historyOpen ||
          tabsOpen ||
          trailsOpen ||
          todayOpen ||
          communityOpen
        ) {
          setMenuOpen(false);
          setHistoryOpen(false);
          setTabsOpen(false);
          setTrailsOpen(false);
          setTodayOpen(false);
          setCommunityOpen(false);
          return true;
        }
        if (browserActive) {
          if (snapshot.canGoBack && activeTabId) {
            browserRefs.current.get(activeTabId)?.goBack();
          } else {
            goHome();
          }
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [
    activeTabId,
    addressOpen,
    browserActive,
    closeAddress,
    communityOpen,
    goHome,
    historyOpen,
    menuOpen,
    snapshot.canGoBack,
    tabsOpen,
    todayOpen,
    trailsOpen,
  ]);

  // Share intake: URLs open in a new tab, plain text becomes a search draft.
  const share = useShareIntent({
    debug: __DEV__,
    resetOnBackground: true,
    disabled: Platform.OS === 'web',
  });
  const { hasShareIntent, shareIntent, resetShareIntent } = share;

  useEffect(() => {
    if (!hasShareIntent) {
      lastShareRef.current = '';
      return;
    }

    const signature = `${shareIntent.webUrl ?? ''}|${shareIntent.text ?? ''}|${
      shareIntent.meta?.title ?? ''
    }`;
    if (signature === lastShareRef.current) return;
    lastShareRef.current = signature;

    const target = targetFromShare(shareIntent);
    resetShareIntent();

    if (!target) {
      toast.show('Nexus can only open web links and text');
      return;
    }

    if (target.kind === 'navigate') {
      openInNewTab(target.url, target.title);
      return;
    }

    addressNewTabRef.current = true;
    setAddressSeed(target.text);
    setAddressOpen(true);
  }, [hasShareIntent, openInNewTab, resetShareIntent, shareIntent, toast]);

  // Widget and deep links: nexus://open?url=…
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let alive = true;

    const handle = (raw: string | null) => {
      const target = targetFromDeepLink(raw);
      if (!target || target.kind !== 'navigate') return;
      openInNewTab(target.url, target.title);
    };

    Linking.getInitialURL()
      .then((url) => {
        if (alive && url) handle(url);
      })
      .catch(() => {});

    const subscription = Linking.addEventListener('url', (event) => {
      handle(event.url);
    });

    return () => {
      alive = false;
      subscription.remove();
    };
  }, [openInNewTab]);

  // Keep the Android widget in step with shortcuts and the calendar day.
  useEffect(() => {
    if (!shortcutsReady) return;
    const timer = setTimeout(() => {
      refreshNexusWidget(shortcuts);
    }, 500);
    return () => clearTimeout(timer);
  }, [shortcuts, shortcutsReady]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppState(state);

      if (state === 'active') {
        setToday(getDailyPage(new Date(), todayPages));
        if (shortcutsReadyRef.current) {
          refreshNexusWidget(shortcutsRef.current);
        }
        return;
      }

      // Nothing private should sit in the app-switcher snapshot. The native
      // shield covers the capture itself; closing modals and drawing the veil
      // cover previews and development builds that lack the native module.
      if (privateChromeRef.current) {
        addressNewTabRef.current = false;
        setAddressOpen(false);
        setMenuOpen(false);
        setHistoryOpen(false);
        setTabsOpen(false);
        setTrailsOpen(false);
        setTodayOpen(false);
        setCommunityOpen(false);
        setPrivateInfoOpen(false);
      }
    });
    return () => subscription.remove();
  }, [privateChromeRef, shortcutsReadyRef, shortcutsRef, todayPages]);

  // The shield follows private tabs, not just the visible private page. A
  // hidden private WebView is still a private page in memory.
  useEffect(() => {
    if (!hasPrivateTabs) return;
    void engagePrivateShield();
    return () => {
      void releasePrivateShield();
    };
  }, [hasPrivateTabs]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getDailyPage(new Date(), todayPages);
      setToday((previous) => (previous.id === next.id ? previous : next));
    }, 60_000);
    return () => clearInterval(timer);
  }, [todayPages]);

  // A published catalog changes the shelf without a restart. Keep the home
  // card in step as soon as the new pages arrive.
  useEffect(() => {
    const next = getDailyPage(new Date(), todayPages);
    setToday((previous) => (previous.id === next.id ? previous : next));
  }, [todayPages]);

  // Discussion lookup is deliberately late and optional: wait until the page
  // has settled, debounce redirects, and stop immediately if the address, tab,
  // or setting changes. Only the page address leaves the device.
  useEffect(() => {
    if (
      !communityEnabled ||
      !communityReady ||
      !browserActive ||
      privateActive ||
      snapshot.loading ||
      !shouldLookupCommunity(snapshot.url)
    ) {
      setCommunityLookup(null);
      setCommunityLoading(false);
      return;
    }

    const controller = new AbortController();
    let alive = true;
    setCommunityLoading(true);

    const timer = setTimeout(() => {
      lookupCommunityThreads(snapshot.url, controller.signal)
        .then((result) => {
          if (!alive) return;
          setCommunityLookup(result);
          setCommunityLoading(false);
        })
        .catch(() => {
          if (!alive) return;
          setCommunityLookup(null);
          setCommunityLoading(false);
        });
    }, 550);

    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    browserActive,
    communityEnabled,
    communityNonce,
    communityReady,
    privateActive,
    snapshot.loading,
    snapshot.url,
  ]);

  // `historyReady` and `trailsReady` are intentionally observed: the home
  // screen may render once with defaults, then again with the stored shelf.
  void historyReady;
  void trailsReady;

  const homeOpacity = shift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const browserOpacity = shift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Animated.View
        style={[styles.layer, { opacity: homeOpacity }]}
        pointerEvents={browserActive ? 'none' : 'auto'}
        accessibilityElementsHidden={browserActive}
        importantForAccessibility={
          browserActive ? 'no-hide-descendants' : 'auto'
        }
      >
        <HomeScreen
          shortcuts={shortcuts}
          history={history}
          trails={trails}
          tabs={normalTabs}
          activeTabId={privateActive ? null : activeTabId}
          privateTabCount={privateTabCount}
          today={today}
          todayLabel={curatedShortDate()}
          curatedPages={CURATED_PAGES}
          adsVisible={!browserActive}
          onOpenSearch={(category = 'web') => {
            setSearchCategory(category);
            openAddress('', true);
          }}
          onOpenVoiceSearch={() => {
            toast.show('Voice search ready — speak your query');
            openAddress('', true);
          }}
          onOpenQrScanner={() => {
            toast.show('Camera scanner ready');
            openAddress('', true);
          }}
          onOpenAi={() => {
            if (snapshot.article) {
              setAiSummaryOpen(true);
            } else {
              setSearchCategory('ai');
              openAddress('', true);
            }
          }}
          onOpenApps={() => setAppsOpen(true)}
          onOpenCollections={() => setCollectionsOpen(true)}
          onOpenDownloads={() => setDownloadsOpen(true)}
          onOpenNotes={() => setNotesOpen(true)}
          onOpenPrivacy={() => setPrivacyOpen(true)}
          onOpenPrivateTab={openPrivateTab}
          onOpenPrivateTabs={openTabs}
          onOpenHistory={openHistory}
          onOpenUrl={(url) => openInNewTab(url)}
          onOpenToday={openToday}
          onOpenTodayArchive={openTodayArchive}
          onOpenTrails={openTrails}
          onOpenTabs={openTabs}
          onOpenSettings={openSettings}
          onOpenTab={activateTab}
          onCloseTab={closeTab}
          onResumeTrail={resumeTrail}
          onToggleTheme={toggleMode}
          onRemoveShortcut={removeShortcut}
          onResetShortcuts={resetShortcuts}
          onRemoveHistoryItem={(id) => {
            setHistory((prev) => prev.filter((item) => item.id !== id));
          }}
          onSavePage={(page) => {
            haptic.success();
            setShortcuts((prev) => {
              if (prev.some((s) => s.url === page.url)) {
                toast.show('Already saved in Pinned Sites');
                return prev;
              }
              toast.show('Saved to Pinned Sites');
              return [
                {
                  id: `shortcut-${createId()}`,
                  title: page.title,
                  url: page.url,
                  host: page.host,
                },
                ...prev,
              ];
            });
          }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.layer,
          {
            opacity: browserOpacity,
            backgroundColor: privateChrome ? privateTheme.bg : undefined,
          },
        ]}
        pointerEvents={browserActive ? 'auto' : 'none'}
        accessibilityElementsHidden={!browserActive}
        importantForAccessibility={
          browserActive ? 'auto' : 'no-hide-descendants'
        }
      >
        {tabs.map((tab) =>
          tab.mounted ? (
            <View
              key={tab.id}
              style={[
                StyleSheet.absoluteFill,
                { opacity: tab.id === activeTabId ? 1 : 0 },
              ]}
              pointerEvents={
                browserActive && tab.id === activeTabId ? 'auto' : 'none'
              }
              accessibilityElementsHidden={tab.id !== activeTabId}
              importantForAccessibility={
                tab.id === activeTabId ? 'auto' : 'no-hide-descendants'
              }
            >
              <ThemeScope theme={tab.private ? privateTheme : theme}>
                {tab.private && !tab.snapshot.url ? (
                  <PrivateStart
                    onSearch={() => {
                      if (tab.id !== activeTabId) activateTab(tab.id);
                      openAddress('');
                    }}
                    onOpenInfo={openPrivateInfo}
                  />
                ) : (
                  <BrowserPane
                    ref={(handle) => {
                      if (handle) browserRefs.current.set(tab.id, handle);
                      else browserRefs.current.delete(tab.id);
                    }}
                    initialUrl={tab.initialUrl}
                    active={browserActive && tab.id === activeTabId}
                    privateTab={tab.private}
                    onSnapshot={(next) => handleSnapshot(tab.id, next)}
                    onVisit={(url, title) => {
                      if (!tab.private) handleVisit(url, title);
                    }}
                    onGoHome={goHome}
                    onDownload={handleStartDownload}
                    onOpenWindow={(url, title) =>
                      handleOpenWindow(url, title, { private: tab.private })
                    }
                    onScrollChange={(visible) => {
                      if (tab.id === activeTabId) {
                        setToolbarVisible(visible);
                      }
                    }}
                  />
                )}
              </ThemeScope>
            </View>
          ) : null,
        )}

        {tabs.length > 0 ? (
          <ThemeScope theme={privateChrome ? privateTheme : theme}>
            <BrowserToolbar
              visible={toolbarVisible}
              snapshot={snapshot}
              tabCount={tabs.length}
              privateTab={privateChrome}
              communityThreads={privateChrome ? [] : communityThreads}
              onOpenCommunity={openCommunity}
              onOpenPrivateInfo={openPrivateInfo}
              onOpenReader={openReader}
              onOpenAiSummary={openAiSummary}
              onBack={() => {
                if (activeTabId)
                  browserRefs.current.get(activeTabId)?.goBack();
              }}
              onForward={() => {
                if (activeTabId)
                  browserRefs.current.get(activeTabId)?.goForward();
              }}
              onOpenAddress={() => openAddress(addressValue)}
              onOpenTabs={openTabs}
              onOpenMenu={() => {
                haptic.tap();
                setMenuOpen(true);
              }}
              onCopy={copyLink}
            />
          </ThemeScope>
        ) : null}
      </Animated.View>

      <ThemeScope theme={addressPrivate ? privateTheme : theme}>
        <AddressOverlay
          visible={addressOpen}
          initialValue={addressSeed}
          history={history}
          shortcuts={shortcuts}
          privateTab={addressPrivate}
          onClose={closeAddress}
          onSubmit={submitAddress}
        />
      </ThemeScope>

      <ThemeScope theme={privateChrome ? privateTheme : theme}>
        <MenuSheet
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          title={snapshot.title}
          url={snapshot.url}
          pinned={pinned}
          onCopy={copyLink}
          onShare={shareLink}
          onTogglePin={togglePin}
          onOpenExternal={openExternal}
          onReload={() => {
            if (activeTabId) browserRefs.current.get(activeTabId)?.reload();
          }}
          onGoHome={goHome}
          onOpenHistory={openHistoryAfterMenu}
          onOpenTabs={openTabsAfterMenu}
          onOpenTrails={openTrailsAfterMenu}
          onOpenCommunity={openCommunityAfterMenu}
          onOpenSettings={openSettings}
          onCloseTab={() => {
            if (activeTabId) closeTab(activeTabId);
          }}
          tabCount={tabs.length}
          trailCount={trails.length}
          communityEnabled={communityEnabled}
          communityThreadCount={communityThreads.length}
          privateTab={privateChrome}
          onOpenPrivateInfo={openPrivateInfoAfterMenu}
          onNewPrivateTab={openPrivateTabAfterMenu}
          onOpenReader={openReaderAfterMenu}
          onListen={startListenAfterMenu}
          onOpenAiSummary={openAiSummaryAfterMenu}
        />
      </ThemeScope>

      <CommunitySheet
        visible={communityOpen}
        onClose={() => setCommunityOpen(false)}
        articleTitle={snapshot.title}
        articleUrl={snapshot.url}
        threads={communityThreads}
        enabled={communityEnabled}
        loading={communityLoading || !communityReady}
        failed={communityFailed}
        onToggleEnabled={setCommunityEnabled}
        onOpenThread={openCommunityThread}
        onRetryLookup={retryCommunity}
      />

      <HistorySheet
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onOpen={(url) => openInNewTab(url)}
        onClear={clearHistory}
      />

      <ThemeScope theme={privateChrome ? privateTheme : theme}>
        <TabsSheet
          visible={tabsOpen}
          onClose={() => setTabsOpen(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          privateMode={privateChrome}
          onSelectTab={activateTab}
          onCloseTab={closeTab}
          onNewTab={newTabFromSheet}
          onNewPrivateTab={newPrivateTabFromSheet}
          onOpenPrivateInfo={openPrivateInfoFromTabs}
          onClosePrivateTabs={closePrivateTabs}
        />
      </ThemeScope>

      <TrailsSheet
        visible={trailsOpen}
        onClose={() => setTrailsOpen(false)}
        trails={trails}
        trailsEnabled={trailsEnabled}
        onToggleTrailsEnabled={(enabled) => setTrailsEnabled(enabled)}
        onOpen={(url) => openInNewTab(url)}
        onResume={resumeTrail}
        onRename={renameTrail}
        onDelete={deleteTrail}
      />

      <TodaySheet
        visible={todayOpen}
        onClose={() => setTodayOpen(false)}
        onOpen={(url) => openInNewTab(url)}
      />

      <ThemeScope theme={privateTheme}>
        <PrivateSheet
          visible={privateInfoOpen}
          onClose={() => setPrivateInfoOpen(false)}
          privateCount={privateTabCount}
          onCloseAll={closePrivateTabs}
        />
      </ThemeScope>

      {privateChrome && appState !== 'active' ? <PrivateVeil /> : null}

      <AudioPlayerBar
        bottomOffset={
          insets.bottom + (tabs.length > 0 ? (toolbarVisible ? 84 : 14) : 20)
        }
        onOpenReader={snapshot.article ? openReader : undefined}
      />

      <ReaderSheet
        visible={readerOpen}
        onClose={() => setReaderOpen(false)}
        article={snapshot.article ?? null}
        onListen={startListen}
        onSummary={() => {
          setReaderOpen(false);
          afterMenu(() => openAiSummary());
        }}
      />

      <AiSummarySheet
        visible={aiSummaryOpen}
        onClose={() => setAiSummaryOpen(false)}
        article={snapshot.article ?? null}
        onOpenReader={() => {
          setAiSummaryOpen(false);
          afterMenu(() => openReader());
        }}
      />

      <CollectionsSheet
        visible={collectionsOpen}
        onClose={() => setCollectionsOpen(false)}
        collections={collections}
        bookmarks={bookmarks}
        activeUrl={snapshot.url}
        activeTitle={snapshot.title}
        onOpenUrl={(url) => openInNewTab(url)}
        onSaveBookmark={(bm) => {
          setBookmarks((prev) => {
            const exists = prev.some((b) => b.id === bm.id);
            if (exists) {
              return prev.map((b) => (b.id === bm.id ? bm : b));
            }
            return [bm, ...prev];
          });
        }}
        onDeleteBookmark={(id) => {
          setBookmarks((prev) => prev.filter((b) => b.id !== id));
        }}
        onSaveCollection={(col) => {
          setCollections((prev) => {
            const exists = prev.some((c) => c.id === col.id);
            if (exists) {
              return prev.map((c) => (c.id === col.id ? col : c));
            }
            return [...prev, col];
          });
        }}
        onDeleteCollection={(id) => {
          setCollections((prev) => prev.filter((c) => c.id !== id));
          setBookmarks((prev) =>
            prev.map((b) =>
              b.collectionId === id ? { ...b, collectionId: 'favorites' } : b,
            ),
          );
        }}
        onImportBookmarks={(importedCols, importedBms) => {
          setCollections((prev) => {
            const ids = new Set(prev.map((c) => c.id));
            const newCols = importedCols.filter((c) => !ids.has(c.id));
            return [...prev, ...newCols];
          });
          setBookmarks((prev) => {
            const urls = new Set(prev.map((b) => b.url.toLowerCase()));
            const newBms = importedBms.filter((b) => !urls.has(b.url.toLowerCase()));
            return [...prev, ...newBms];
          });
        }}
      />

      <PrivacySheet
        visible={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        activeUrl={snapshot.url}
        onClearHistory={() => setHistory([])}
        onClearCache={() => {
          if (activeTabId) {
            browserRefs.current.get(activeTabId)?.reload();
          }
        }}
        onClearCookies={() => {
          toast.show('Site data and cookies reset');
        }}
        onOpenPrivateTab={openPrivateTab}
      />

      <DownloadsSheet
        visible={downloadsOpen}
        onClose={() => setDownloadsOpen(false)}
        downloads={downloads}
        onStartDownload={handleStartDownload}
        onCancelDownload={handleCancelDownload}
        onOpenDownload={handleOpenDownload}
        onDeleteDownload={handleDeleteDownload}
        onClearCompleted={handleClearCompletedDownloads}
      />

      <NotesSheet
        visible={notesOpen}
        onClose={() => setNotesOpen(false)}
        notes={notes}
        activeUrl={snapshot.url}
        activeTitle={snapshot.title}
        onSaveNote={(note) => {
          setNotes((prev) => {
            const exists = prev.some((n) => n.id === note.id);
            if (exists) {
              return prev.map((n) => (n.id === note.id ? note : n));
            }
            return [note, ...prev];
          });
        }}
        onDeleteNote={(id) => {
          setNotes((prev) => prev.filter((n) => n.id !== id));
        }}
        onOpenUrl={(url) => openInNewTab(url)}
      />

      <AppsSheet
        visible={appsOpen}
        onClose={() => setAppsOpen(false)}
        onOpenDownloads={() => setDownloadsOpen(true)}
        onOpenNotes={() => setNotesOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenTrails={() => setTrailsOpen(true)}
        onOpenArchive={() => setTodayOpen(true)}
        onOpenSettings={() => openSettings()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
