import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { relativeTime } from '@/lib/time';
import { getDisplayUrl } from '@/lib/url';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts, layout, privateTheme, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type {
  BrowserTab,
  CuratedPage,
  HistoryEntry,
  Shortcut,
  Trail,
} from '@/types';
import { BrandMark } from './BrandMark';
import { Favicon } from './Favicon';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PressableScale } from './PressableScale';
import { ScreenBackdrop } from './ScreenBackdrop';
import { TodayCard } from './TodayCard';
import { TrailCard } from './TrailCard';

type Props = {
  shortcuts: Shortcut[];
  history: HistoryEntry[];
  trails: Trail[];
  tabs: BrowserTab[];
  activeTabId: string | null;
  privateTabCount: number;
  today: CuratedPage;
  todayLabel: string;
  onOpenSearch: () => void;
  onOpenPrivateTab: () => void;
  onOpenPrivateTabs: () => void;
  onOpenHistory: () => void;
  onOpenUrl: (url: string) => void;
  onOpenToday: () => void;
  onOpenTodayArchive: () => void;
  onOpenTrails: () => void;
  onOpenTabs: () => void;
  onOpenTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onResumeTrail: (trail: Trail) => void;
  onToggleTheme: () => void;
  onRemoveShortcut: (shortcut: Shortcut) => void;
  onResetShortcuts: () => void;
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
  onOpenSearch,
  onOpenPrivateTab,
  onOpenPrivateTabs,
  onOpenHistory,
  onOpenUrl,
  onOpenToday,
  onOpenTodayArchive,
  onOpenTrails,
  onOpenTabs,
  onOpenTab,
  onCloseTab,
  onResumeTrail,
  onToggleTheme,
  onRemoveShortcut,
  onResetShortcuts,
}: Props) {
  const { theme, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState(false);

  const displaySize = Math.min(60, Math.max(43, width * 0.132));
  const recent = history.slice(0, 3);
  const latestTrail = trails[0];

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenBackdrop />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 34,
          },
        ]}
      >
        <View style={styles.content}>
          <Reveal delay={0}>
            <View style={styles.header}>
              <View style={styles.brand}>
                <BrandMark
                  size={23}
                  color={theme.ink}
                  accent={theme.accent}
                  strokeWidth={1.65}
                />
                <Text style={[styles.wordmark, { color: theme.ink }]}>Mira</Text>
              </View>
              <View style={styles.headerActions}>
                <IconButton
                  icon="mask"
                  label="Open a private tab"
                  variant="surface"
                  size={38}
                  color={theme.accent}
                  onPress={onOpenPrivateTab}
                />
                <IconButton
                  icon="clock"
                  label="Open history"
                  variant="surface"
                  size={38}
                  onPress={onOpenHistory}
                />
                <IconButton
                  icon={mode === 'dark' ? 'sun' : 'moon'}
                  label={mode === 'dark' ? 'Use light theme' : 'Use dark theme'}
                  variant="surface"
                  size={38}
                  onPress={onToggleTheme}
                />
              </View>
            </View>
          </Reveal>

          <Reveal delay={60}>
            <View style={styles.hero}>
              <View style={styles.eyebrowRow}>
                <View style={[styles.eyebrowLine, { backgroundColor: theme.accent }]} />
                <Text style={[styles.eyebrow, { color: theme.muted }]}>
                  THE QUIET WEB
                </Text>
              </View>
              <Text
                style={[
                  styles.headline,
                  {
                    color: theme.ink,
                    fontSize: displaySize,
                    lineHeight: displaySize * 0.95,
                  },
                ]}
              >
                The web,{'\n'}
                <Text style={[styles.headlineItalic, { fontFamily: fonts.serifItalic }]}>
                  uncluttered
                </Text>
                <Text style={{ color: theme.accent }}>.</Text>
              </Text>
              <Text style={[styles.subline, { color: theme.muted }]}>
                Search, read, and wander — without the feed.
              </Text>
            </View>
          </Reveal>

          <Reveal delay={140}>
            <PressableScale
              onPress={() => {
                haptic.tap();
                onOpenSearch();
              }}
              accessibilityLabel="Search or enter a website"
              style={[
                styles.searchDock,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                },
                softShadow(theme.mode, 'dock'),
              ]}
            >
              <View style={[styles.searchIcon, { backgroundColor: theme.accentSoft }]}>
                <Icon name="globe" size={20} color={theme.accent} />
              </View>
              <View style={styles.searchCopy}>
                <Text style={[styles.searchTitle, { color: theme.ink }]}>
                  Search or enter a website
                </Text>
                <Text style={[styles.searchHint, { color: theme.muted }]}>
                  Private results · DuckDuckGo
                </Text>
              </View>
              <View style={[styles.searchGo, { backgroundColor: theme.accent }]}>
                <Icon
                  name="arrowRight"
                  size={19}
                  color={theme.accentInk}
                  strokeWidth={2.1}
                />
              </View>
            </PressableScale>

            {privateTabCount > 0 ? (
              <PressableScale
                onPress={() => {
                  haptic.tap();
                  onOpenPrivateTabs();
                }}
                scaleTo={0.985}
                accessibilityLabel={`Private tabs, ${privateTabCount} open. Opens the tab shelf.`}
                style={[
                  styles.privateStrip,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.privateStripIcon,
                    { backgroundColor: privateTheme.accentSoft },
                  ]}
                >
                  <Icon
                    name="mask"
                    size={17}
                    color={privateTheme.accent}
                    strokeWidth={1.7}
                  />
                </View>
                <View style={styles.privateStripCopy}>
                  <Text style={[styles.privateStripTitle, { color: theme.ink }]}>
                    Private tabs
                  </Text>
                  <Text style={[styles.privateStripHint, { color: theme.muted }]}>
                    {privateTabCount} open · no history
                  </Text>
                </View>
                <Icon
                  name="chevronRight"
                  size={15}
                  color={theme.faint}
                  strokeWidth={2}
                />
              </PressableScale>
            ) : null}
          </Reveal>

          <Reveal delay={200}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                  TODAY&apos;S PAGE
                </Text>
                <Pressable
                  onPress={() => {
                    haptic.tap();
                    onOpenTodayArchive();
                  }}
                  hitSlop={10}
                  style={styles.seeAll}
                  accessibilityRole="button"
                  accessibilityLabel="Open the daily page archive"
                >
                  <Text style={[styles.sectionAction, { color: theme.inkSoft }]}>
                    Archive
                  </Text>
                  <Icon
                    name="archive"
                    size={12}
                    color={theme.faint}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
              <View style={styles.todayWrap}>
                <TodayCard
                  page={today}
                  dateLabel={todayLabel}
                  onPress={() => {
                    haptic.tap();
                    onOpenToday();
                  }}
                />
              </View>
            </View>
          </Reveal>

          {latestTrail ? (
            <Reveal delay={260}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                    TRAILS
                  </Text>
                  <Pressable
                    onPress={() => {
                      haptic.tap();
                      onOpenTrails();
                    }}
                    hitSlop={10}
                    style={styles.seeAll}
                    accessibilityRole="button"
                    accessibilityLabel="See all trails"
                  >
                    <Text
                      style={[styles.sectionAction, { color: theme.inkSoft }]}
                    >
                      See all
                    </Text>
                    <Icon
                      name="chevronRight"
                      size={13}
                      color={theme.faint}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
                <View style={styles.trailWrap}>
                  <TrailCard
                    trail={latestTrail}
                    onPress={() => {
                      haptic.tap();
                      onResumeTrail(latestTrail);
                    }}
                    onOpenAll={() => {
                      haptic.tap();
                      onOpenTrails();
                    }}
                  />
                </View>
              </View>
            </Reveal>
          ) : null}

          {tabs.length > 0 ? (
            <Reveal delay={315}>
              <View style={styles.section}>
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
                    const display = getDisplayUrl(url);
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
                            borderWidth: active ? 1.3 : StyleSheet.hairlineWidth,
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

          <Reveal delay={370}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                  SHORTCUTS
                </Text>
                {shortcuts.length > 0 ? (
                  <Pressable
                    onPress={() => {
                      haptic.select();
                      setEditing((value) => !value);
                    }}
                    hitSlop={10}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.sectionAction,
                        { color: editing ? theme.accent : theme.inkSoft },
                      ]}
                    >
                      {editing ? 'Done' : 'Edit'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {shortcuts.length > 0 ? (
                <View style={styles.shortcutGrid}>
                  {shortcuts.map((shortcut) => (
                    <ShortcutItem
                      key={shortcut.id}
                      shortcut={shortcut}
                      editing={editing}
                      onPress={() => {
                        if (editing) {
                          haptic.warn();
                          onRemoveShortcut(shortcut);
                        } else {
                          haptic.tap();
                          onOpenUrl(shortcut.url);
                        }
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyShortcuts,
                    { backgroundColor: theme.surface, borderColor: theme.line },
                  ]}
                >
                  <View style={[styles.emptyIcon, { backgroundColor: theme.chip }]}>
                    <Icon name="plus" size={18} color={theme.inkSoft} />
                  </View>
                  <View style={styles.emptyCopy}>
                    <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                      Make it yours
                    </Text>
                    <Text style={[styles.emptyBody, { color: theme.muted }]}>
                      Pin pages from the browser menu and they will wait for you here.
                    </Text>
                  </View>
                </View>
              )}

              {editing ? (
                <View style={styles.editFooter}>
                  <Text style={[styles.editHint, { color: theme.muted }]}>
                    Tap a shortcut to remove it.
                  </Text>
                  <Pressable
                    onPress={() => {
                      haptic.select();
                      onResetShortcuts();
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.restore, { color: theme.accent }]}>
                      Restore defaults
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </Reveal>

          <Reveal delay={430}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: theme.muted }]}>RECENT</Text>
                {history.length > 0 ? (
                  <Pressable
                    onPress={() => {
                      haptic.tap();
                      onOpenHistory();
                    }}
                    hitSlop={10}
                    style={styles.seeAll}
                    accessibilityRole="button"
                    accessibilityLabel="See all history"
                  >
                    <Text style={[styles.sectionAction, { color: theme.inkSoft }]}>
                      See all
                    </Text>
                    <Icon
                      name="chevronRight"
                      size={13}
                      color={theme.faint}
                      strokeWidth={2}
                    />
                  </Pressable>
                ) : null}
              </View>

              {recent.length > 0 ? (
                <View
                  style={[
                    styles.recentCard,
                    { backgroundColor: theme.surface, borderColor: theme.line },
                    softShadow(theme.mode),
                  ]}
                >
                  {recent.map((entry, index) => (
                    <Pressable
                      key={entry.id}
                      onPress={() => {
                        haptic.tap();
                        onOpenUrl(entry.url);
                      }}
                      style={({ pressed }) => [
                        styles.recentRow,
                        index > 0
                          ? {
                              borderTopWidth: StyleSheet.hairlineWidth,
                              borderTopColor: theme.line,
                            }
                          : null,
                        pressed ? { opacity: 0.7 } : null,
                      ]}
                      accessibilityRole="link"
                      accessibilityLabel={`Open ${entry.title}`}
                    >
                      <Favicon
                        host={entry.host}
                        title={entry.title}
                        size={34}
                      />
                      <View style={styles.recentCopy}>
                        <Text
                          numberOfLines={1}
                          style={[styles.recentTitle, { color: theme.ink }]}
                        >
                          {entry.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[styles.recentMeta, { color: theme.muted }]}
                        >
                          {entry.host} · {relativeTime(entry.visitedAt)}
                        </Text>
                      </View>
                      <Icon
                        name="arrowUpRight"
                        size={15}
                        color={theme.faint}
                        strokeWidth={1.9}
                      />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyRecent,
                    { backgroundColor: theme.surface, borderColor: theme.line },
                  ]}
                >
                  <View style={[styles.emptyIcon, { backgroundColor: theme.chip }]}>
                    <Icon name="clock" size={18} color={theme.inkSoft} />
                  </View>
                  <View style={styles.emptyCopy}>
                    <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                      No pages yet
                    </Text>
                    <Text style={[styles.emptyBody, { color: theme.muted }]}>
                      The places you wander will show up here, on this device only.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Reveal>

          <Reveal delay={500}>
            <View style={styles.footer}>
              <Icon name="shield" size={14} color={theme.faint} strokeWidth={1.7} />
              <Text style={[styles.footerText, { color: theme.faint }]}>
                No account. No feed. No noise.
              </Text>
            </View>
          </Reveal>
        </View>
      </ScrollView>
    </View>
  );
}

function ShortcutItem({
  shortcut,
  editing,
  onPress,
}: {
  shortcut: Shortcut;
  editing: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.shortcutItem}>
      <PressableScale
        onPress={onPress}
        style={[
          styles.shortcutTile,
          { backgroundColor: theme.surface, borderColor: theme.line },
          softShadow(theme.mode),
        ]}
        accessibilityLabel={editing ? `Remove ${shortcut.title}` : `Open ${shortcut.title}`}
      >
        <Favicon host={shortcut.host} title={shortcut.title} size={28} plain />
        {editing ? (
          <View
            style={[
              styles.removeBadge,
              { backgroundColor: theme.accent, borderColor: theme.surface },
            ]}
          >
            <Icon name="close" size={9} color={theme.accentInk} strokeWidth={2.6} />
          </View>
        ) : null}
      </PressableScale>
      <Text
        numberOfLines={1}
        style={[styles.shortcutLabel, { color: theme.inkSoft }]}
      >
        {shortcut.title}
      </Text>
    </View>
  );
}

function Reveal({
  children,
  delay,
}: {
  children: ReactNode;
  delay: number;
}) {
  const progress = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 620,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 26,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  hero: {
    marginTop: 40,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  eyebrowLine: {
    width: 17,
    height: 1.5,
    borderRadius: 1,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.75,
  },
  headline: {
    fontFamily: fonts.serif,
    letterSpacing: -1.25,
    includeFontPadding: false,
  },
  headlineItalic: {
    letterSpacing: -0.7,
  },
  subline: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 14,
    maxWidth: 330,
  },
  searchDock: {
    marginTop: 30,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 12,
  },
  searchIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCopy: {
    flex: 1,
    gap: 2,
  },
  searchTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  searchHint: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  searchGo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateStrip: {
    marginTop: 10,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  privateStripIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateStripCopy: {
    flex: 1,
    gap: 1,
  },
  privateStripTitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  privateStripHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  section: {
    marginTop: 34,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 1.65,
  },
  sectionAction: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  todayWrap: {
    marginTop: 14,
  },
  trailWrap: {
    marginTop: 14,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  countBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 9.5,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
  },
  tabStrip: {
    gap: 8,
    paddingTop: 12,
    paddingRight: 4,
  },
  tabChip: {
    height: 40,
    maxWidth: 178,
    borderRadius: 20,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tabChipBody: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 10,
    alignSelf: 'stretch',
  },
  tabActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tabChipText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    maxWidth: 88,
  },
  tabChipClose: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
  },
  shortcutGrid: {
    marginTop: 18,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
  },
  shortcutItem: {
    width: '23.2%',
    alignItems: 'center',
  },
  shortcutTile: {
    width: 58,
    height: 58,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  shortcutLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    marginTop: 8,
    maxWidth: 84,
    textAlign: 'center',
  },
  editFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  editHint: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    flex: 1,
  },
  restore: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
  },
  emptyShortcuts: {
    marginTop: 18,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyRecent: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    flex: 1,
    gap: 3,
  },
  emptyTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  emptyBody: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  recentCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  recentCopy: {
    flex: 1,
    gap: 2,
  },
  recentTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  recentMeta: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  footer: {
    marginTop: 36,
    paddingTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
