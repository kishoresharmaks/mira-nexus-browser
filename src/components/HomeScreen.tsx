import { useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAds } from '@/lib/ads-provider';
import { useCatalogConfig } from '@/lib/catalog-provider';
import { haptic } from '@/lib/haptics';
import { getDisplayUrl } from '@/lib/url';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type {
  BrowserTab,
  CuratedPage,
  HistoryEntry,
  Shortcut,
  Trail,
} from '@/types';
import { Favicon } from './Favicon';
import { HomeAdSlot } from './HomeAdSlot';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { ScreenBackdrop } from './ScreenBackdrop';
import { ContinueReading } from './home/ContinueReading';
import { DiscoverySection } from './home/DiscoverySection';
import { HomeBottomNavigation, type NavItem } from './home/HomeBottomNavigation';
import { HomeHeader } from './home/HomeHeader';
import { HomeHero } from './home/HomeHero';
import type { SearchCategory } from './home/SearchCategories';
import { SmartSearch } from './home/SmartSearch';
import { TrailsSection } from './home/TrailsSection';
import { YourWebGrid } from './home/YourWebGrid';

type Props = {
  shortcuts: Shortcut[];
  history: HistoryEntry[];
  trails: Trail[];
  tabs: BrowserTab[];
  activeTabId: string | null;
  privateTabCount: number;
  today: CuratedPage;
  todayLabel: string;
  curatedPages?: CuratedPage[];
  adsVisible: boolean;
  onOpenSearch: (category?: SearchCategory) => void;
  onOpenVoiceSearch?: () => void;
  onOpenQrScanner?: () => void;
  onOpenAi: () => void;
  onOpenApps?: () => void;
  onOpenExplore?: () => void;
  onOpenSaved?: () => void;
  onOpenCollections: () => void;
  onOpenDownloads: () => void;
  onOpenNotes: () => void;
  onOpenPrivacy: () => void;
  onOpenPrivateTab: () => void;
  onOpenPrivateTabs: () => void;
  onOpenHistory: () => void;
  onOpenUrl: (url: string) => void;
  onOpenToday: () => void;
  onOpenTodayArchive: () => void;
  onOpenTrails: () => void;
  onOpenTabs: () => void;
  onOpenSettings: () => void;
  onOpenTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onResumeTrail: (trail: Trail) => void;
  onToggleTheme: () => void;
  onRemoveShortcut: (shortcut: Shortcut) => void;
  onResetShortcuts: () => void;
  onRemoveHistoryItem?: (id: string) => void;
  onSavePage?: (page: CuratedPage) => void;
};

export function HomeScreen({
  shortcuts,
  history,
  trails,
  tabs,
  activeTabId,
  privateTabCount,
  today,
  todayLabel,
  curatedPages,
  adsVisible,
  onOpenSearch,
  onOpenVoiceSearch,
  onOpenQrScanner,
  onOpenAi,
  onOpenApps,
  onOpenExplore,
  onOpenSaved,
  onOpenCollections,
  onOpenDownloads,
  onOpenNotes,
  onOpenPrivacy,
  onOpenPrivateTab,
  onOpenPrivateTabs,
  onOpenHistory,
  onOpenUrl,
  onOpenToday,
  onOpenTodayArchive,
  onOpenTrails,
  onOpenTabs,
  onOpenSettings,
  onOpenTab,
  onCloseTab,
  onResumeTrail,
  onToggleTheme,
  onRemoveShortcut,
  onResetShortcuts,
  onRemoveHistoryItem,
  onSavePage,
}: Props) {
  const { theme } = useTheme();
  const { engines } = useCatalogConfig();
  const { ads, showRewardedAd } = useAds();
  const insets = useSafeAreaInsets();
  const [activeBottomNav, setActiveBottomNav] = useState<NavItem>('home');

  const discoveryPages = curatedPages && curatedPages.length > 0
    ? curatedPages
    : [today];

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenBackdrop />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 90, // Leave room for floating bottom nav
          },
        ]}
      >
        <View style={styles.content}>
          {/* Section 1: Header */}
          <Reveal delay={0}>
            <HomeHeader
              onOpenAi={onOpenAi}
              onOpenHistory={onOpenHistory}
              onToggleTheme={onToggleTheme}
              onOpenSettings={onOpenSettings}
            />
          </Reveal>

          {/* Section 2: Hero */}
          <Reveal delay={50}>
            <HomeHero />
          </Reveal>

          {/* Section 3: Smart Search */}
          <Reveal delay={100}>
            <SmartSearch
              onOpenSearch={onOpenSearch}
              onOpenVoiceSearch={onOpenVoiceSearch}
              onOpenQrScanner={onOpenQrScanner}
              onOpenEnginePicker={onOpenSettings}
              privateTabCount={privateTabCount}
              onOpenPrivateTabs={onOpenPrivateTabs}
            />
          </Reveal>

          {/* Section 4: Your Web (6-item feature grid + pinned sites) */}
          <Reveal delay={150}>
            <YourWebGrid
              shortcuts={shortcuts}
              onOpenCollections={onOpenCollections}
              onOpenHistory={onOpenHistory}
              onOpenTrails={onOpenTrails}
              onOpenDownloads={onOpenDownloads}
              onOpenNotes={onOpenNotes}
              onOpenPrivacy={onOpenPrivacy}
              onOpenShortcut={(url) => {
                if (ads.rewardedEnabled) {
                  showRewardedAd(() => onOpenUrl(url));
                } else {
                  onOpenUrl(url);
                }
              }}
              onRemoveShortcut={onRemoveShortcut}
              onResetShortcuts={onResetShortcuts}
            />
          </Reveal>

          {/* Section 5: Discover Today */}
          <Reveal delay={200}>
            <DiscoverySection
              pages={discoveryPages}
              todayLabel={todayLabel}
              history={history}
              onOpenPage={onOpenUrl}
              onSavePage={onSavePage}
              onOpenArchive={onOpenTodayArchive}
              onOpenTrails={onOpenTrails}
              onOpenCollections={onOpenCollections}
            />
          </Reveal>

          <HomeAdSlot layout="inline" visible={adsVisible} />

          {/* Open Tabs Horizontal Strip (if tabs open) */}
          {tabs.length > 0 ? (
            <Reveal delay={240}>
              <View style={styles.tabsSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLabelRow}>
                    <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                      OPEN TABS
                    </Text>
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: theme.chip },
                      ]}
                    >
                      <Text
                        style={[styles.countText, { color: theme.inkSoft }]}
                      >
                        {tabs.length}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      haptic.tap();
                      onOpenTabs();
                    }}
                    hitSlop={10}
                    style={styles.seeAll}
                    accessibilityRole="button"
                    accessibilityLabel="See all open tabs"
                  >
                    <Text
                      style={[styles.sectionAction, { color: theme.inkSoft }]}
                    >
                      All tabs
                    </Text>
                    <Icon
                      name="chevronRight"
                      size={13}
                      color={theme.faint}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabStrip}
                >
                  {tabs.map((tab) => {
                    const url = tab.snapshot.url || tab.initialUrl;
                    const display = getDisplayUrl(url, engines);
                    const active = tab.id === activeTabId;
                    const title = tab.snapshot.title || display.host;

                    return (
                      <View
                        key={tab.id}
                        style={[
                          styles.tabChip,
                          {
                            backgroundColor: theme.surface,
                            borderColor: active ? theme.accent : theme.line,
                            borderWidth: active ? 1.4 : StyleSheet.hairlineWidth,
                          },
                        ]}
                      >
                        <PressableScale
                          onPress={() => {
                            haptic.tap();
                            onOpenTab(tab.id);
                          }}
                          scaleTo={0.97}
                          style={styles.tabChipBody}
                          accessibilityLabel={`${active ? 'Return to' : 'Open'} ${title}`}
                        >
                          {active ? (
                            <View
                              style={[
                                styles.tabActiveDot,
                                { backgroundColor: theme.accent },
                              ]}
                            />
                          ) : null}
                          <Favicon
                            host={display.host}
                            title={title}
                            size={20}
                            plain
                          />
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.tabChipText,
                              { color: theme.inkSoft },
                            ]}
                          >
                            {display.host}
                          </Text>
                        </PressableScale>
                        <Pressable
                          onPress={() => {
                            haptic.warn();
                            onCloseTab(tab.id);
                          }}
                          hitSlop={10}
                          style={[
                            styles.tabChipClose,
                            {
                              backgroundColor: theme.chip,
                              borderColor: theme.line,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Close ${title}`}
                        >
                          <Icon
                            name="close"
                            size={9}
                            color={theme.inkSoft}
                            strokeWidth={2.4}
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </Reveal>
          ) : null}

          {/* Section 6: Trails */}
          <Reveal delay={280}>
            <TrailsSection
              trails={trails}
              onResumeTrail={onResumeTrail}
              onOpenTrails={onOpenTrails}
            />
          </Reveal>

          {/* Section 7: Continue Reading (Recent history) */}
          <Reveal delay={320}>
            <ContinueReading
              history={history}
              onOpenPage={onOpenUrl}
              onOpenHistory={onOpenHistory}
              onRemoveItem={onRemoveHistoryItem}
            />
          </Reveal>
        </View>
      </ScrollView>

      {/* Section 8: Homepage Floating Bottom Navigation */}
      <HomeBottomNavigation
        activeTab={activeBottomNav}
        tabCount={tabs.length}
        onPressHome={() => {
          setActiveBottomNav('home');
        }}
        onPressTabs={() => {
          onOpenTabs();
        }}
        onPressAi={() => {
          onOpenAi();
        }}
        onPressSaved={() => {
          if (onOpenSaved) {
            onOpenSaved();
          } else {
            onOpenCollections();
          }
        }}
        onPressExplore={() => {
          if (onOpenExplore) {
            onOpenExplore();
          } else if (onOpenApps) {
            onOpenApps();
          } else {
            onOpenDownloads();
          }
        }}
      />
    </View>
  );
}

function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const opacity = useAnimatedValue(0);
  const translateY = useAnimatedValue(12);

  useState(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  content: {
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  tabsSection: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionAction: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  tabStrip: {
    gap: 8,
    paddingVertical: 2,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingLeft: 10,
    paddingRight: 6,
    height: 42,
    gap: 6,
  },
  tabChipBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    maxWidth: 160,
  },
  tabActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabChipText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  tabChipClose: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
