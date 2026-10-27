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
import { useShareIntent } from 'expo-share-intent';
import { AddressOverlay } from '@/components/AddressOverlay';
import { BrowserPane } from '@/components/BrowserPane';
import { BrowserToolbar } from '@/components/BrowserToolbar';
import { CommunitySheet } from '@/components/CommunitySheet';
import { HistorySheet } from '@/components/HistorySheet';
import { HomeScreen } from '@/components/HomeScreen';
import { MenuSheet } from '@/components/MenuSheet';
import { TabsSheet } from '@/components/TabsSheet';
import { TodaySheet } from '@/components/TodaySheet';
import { TrailsSheet } from '@/components/TrailsSheet';
import { useToast } from '@/components/Toast';
import {
  canonicalizeArticleUrl,
  invalidateCommunityLookup,
  lookupCommunityThreads,
  normalizeCommunityEnabled,
  shouldLookupCommunity,
  type CommunityLookup,
} from '@/lib/community';
import { curatedShortDate, getDailyPage } from '@/lib/curation';
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
  appendTrailVisit,
  normalizeTrails,
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
import { refreshMiraWidget } from '@/widgets/update-widget';
import { useTheme } from '@/theme/ThemeProvider';
import type {
  BrowserHandle,
  BrowserTab,
  CuratedPage,
  HistoryEntry,
  PageSnapshot,
  Shortcut,
  Trail,
} from '@/types';

const EMPTY_PAGE: PageSnapshot = {
  url: '',
  title: '',
  canGoBack: false,
  canGoForward: false,
  loading: false,
};

function createTab(url: string, title?: string): BrowserTab {
  const now = Date.now();
  return {
    id: `tab-${createId()}`,
    initialUrl: url,
    createdAt: now,
    lastActiveAt: now,
    // The WebView mounts the first time the tab is shown. No hidden pages are
    // preloaded, and closing the tab releases the native view.
    mounted: true,
    snapshot: {
      url,
      title: title ? cleanTitle(title, url) : hostOf(url),
      canGoBack: false,
      canGoForward: false,
      loading: true,
    },
  };
}

export default function Mira() {
  const { theme, toggleMode } = useTheme();
  const toast = useToast();

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

  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [browserActive, setBrowserActive] = useState(false);

  const [addressOpen, setAddressOpen] = useState(false);
  const [addressSeed, setAddressSeed] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tabsOpen, setTabsOpen] = useState(false);
  const [trailsOpen, setTrailsOpen] = useState(false);
  const [todayOpen, setTodayOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [today, setToday] = useState<CuratedPage>(() => getDailyPage());
  const [communityLookup, setCommunityLookup] =
    useState<CommunityLookup | null>(null);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityNonce, setCommunityNonce] = useState(0);

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
  const pinned = shortcuts.some((item) => item.url === snapshot.url);
  const addressValue = searchQueryFromUrl(snapshot.url) ?? snapshot.url;
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
      revealBrowser();
    },
    [revealBrowser, tabsRef],
  );

  const openInNewTab = useCallback(
    (rawUrl: string, title?: string) => {
      const url = toSecureHttps(rawUrl) ?? (isWebUrl(rawUrl) ? rawUrl : null);
      if (!url) return;

      const current = tabsRef.current;
      const existing = current.find(
        (tab) => tab.snapshot.url === url || tab.initialUrl === url,
      );
      if (existing) {
        activateTab(existing.id);
        return;
      }

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

      const tab = createTab(url, title);
      setTabs([...survivors, tab]);
      setActiveTabId(tab.id);
      revealBrowser();

      if (evicted) {
        toast.show(
          `Closed ${hostOf(evicted.snapshot.url || evicted.initialUrl)} to make room`,
        );
      }
    },
    [activateTab, activeTabRef, revealBrowser, tabsRef, toast],
  );

  const navigateTab = useCallback(
    (id: string, url: string) => {
      const tab = tabsRef.current.find((item) => item.id === id);
      if (!tab) return;

      if (tab.mounted) {
        browserRefs.current.get(id)?.load(url);
      } else {
        setTabs((previous) =>
          previous.map((item) =>
            item.id === id
              ? {
                  ...item,
                  initialUrl: url,
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
      revealBrowser();
    },
    [revealBrowser, tabsRef],
  );

  const openAddress = useCallback((seed = '', newTab = false) => {
    haptic.tap();
    addressNewTabRef.current = newTab;
    setAddressSeed(seed);
    setAddressOpen(true);
  }, []);

  const closeAddress = useCallback(() => {
    addressNewTabRef.current = false;
    setAddressSeed('');
    setAddressOpen(false);
  }, []);

  const submitAddress = useCallback(
    (raw: string) => {
      const target = resolveInput(raw);
      if (!target) return;
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
    [activeTabRef, browserActiveRef, navigateTab, openInNewTab],
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
    setTabsOpen(true);
  }, []);

  const afterMenu = useCallback((action: () => void) => {
    if (sheetTimer.current) clearTimeout(sheetTimer.current);
    sheetTimer.current = setTimeout(action, 280);
  }, []);

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
    afterMenu(() => openAddress('', true));
  }, [afterMenu, openAddress]);

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
          current.loading === next.loading
        ) {
          return tab;
        }
        return { ...tab, snapshot: next };
      }),
    );
  }, []);

  const handleVisit = useCallback(
    (url: string, title: string) => {
      if (!isWebUrl(url) || searchQueryFromUrl(url)) return;
      const entry = historyEntry(url, title);
      if (!entry) return;

      setHistory((previous) =>
        [entry, ...previous.filter((item) => item.url !== url)].slice(
          0,
          HISTORY_LIMIT,
        ),
      );
      setTrails((previous) =>
        appendTrailVisit(previous, trailFromHistory(entry), entry.visitedAt),
      );
    },
    [setHistory, setTrails],
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
      const last = trail.pages[trail.pages.length - 1];
      if (!last) return;
      openInNewTab(last.url, last.title);
    },
    [openInNewTab],
  );

  const handleOpenWindow = useCallback(
    (url: string, title?: string) => {
      openInNewTab(url, title);
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
      toast.show('Mira can only open web links and text');
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

  // Widget and deep links: mira://open?url=…
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
      refreshMiraWidget(shortcuts);
    }, 500);
    return () => clearTimeout(timer);
  }, [shortcuts, shortcutsReady]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setToday(getDailyPage());
      if (shortcutsReadyRef.current) {
        refreshMiraWidget(shortcutsRef.current);
      }
    });
    return () => subscription.remove();
  }, [shortcutsReadyRef, shortcutsRef]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getDailyPage();
      setToday((previous) => (previous.id === next.id ? previous : next));
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Discussion lookup is deliberately late and optional: wait until the page
  // has settled, debounce redirects, and stop immediately if the address, tab,
  // or setting changes. Only the page address leaves the device.
  useEffect(() => {
    if (
      !communityEnabled ||
      !communityReady ||
      !browserActive ||
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
          tabs={tabs}
          activeTabId={activeTabId}
          today={today}
          todayLabel={curatedShortDate()}
          onOpenSearch={() => openAddress('', true)}
          onOpenHistory={openHistory}
          onOpenUrl={(url) => openInNewTab(url)}
          onOpenToday={openToday}
          onOpenTodayArchive={openTodayArchive}
          onOpenTrails={openTrails}
          onOpenTabs={openTabs}
          onOpenTab={activateTab}
          onCloseTab={closeTab}
          onResumeTrail={resumeTrail}
          onToggleTheme={toggleMode}
          onRemoveShortcut={removeShortcut}
          onResetShortcuts={resetShortcuts}
        />
      </Animated.View>

      <Animated.View
        style={[styles.layer, { opacity: browserOpacity }]}
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
              <BrowserPane
                ref={(handle) => {
                  if (handle) browserRefs.current.set(tab.id, handle);
                  else browserRefs.current.delete(tab.id);
                }}
                initialUrl={tab.initialUrl}
                active={browserActive && tab.id === activeTabId}
                onSnapshot={(next) => handleSnapshot(tab.id, next)}
                onVisit={handleVisit}
                onGoHome={goHome}
                onOpenWindow={handleOpenWindow}
              />
            </View>
          ) : null,
        )}

        {tabs.length > 0 ? (
          <BrowserToolbar
            snapshot={snapshot}
            tabCount={tabs.length}
            communityThreads={communityThreads}
            onOpenCommunity={openCommunity}
            onBack={() => {
              if (activeTabId) browserRefs.current.get(activeTabId)?.goBack();
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
        ) : null}
      </Animated.View>

      <AddressOverlay
        visible={addressOpen}
        initialValue={addressSeed}
        history={history}
        shortcuts={shortcuts}
        onClose={closeAddress}
        onSubmit={submitAddress}
      />

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
        onCloseTab={() => {
          if (activeTabId) closeTab(activeTabId);
        }}
        tabCount={tabs.length}
        trailCount={trails.length}
        communityEnabled={communityEnabled}
        communityThreadCount={communityThreads.length}
      />

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

      <TabsSheet
        visible={tabsOpen}
        onClose={() => setTabsOpen(false)}
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={activateTab}
        onCloseTab={closeTab}
        onNewTab={newTabFromSheet}
      />

      <TrailsSheet
        visible={trailsOpen}
        onClose={() => setTrailsOpen(false)}
        trails={trails}
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
