import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Favicon } from '../Favicon';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { CuratedPage, HistoryEntry } from '@/types';

type DiscoveryFilter = 'all' | 'destinations' | 'essays' | 'recent';

type DiscoveryDestination = {
  id: string;
  name: string;
  category: 'ai' | 'media' | 'reference' | 'news';
  url: string;
  host: string;
  note: string;
  icon: IconName;
};

const USEFUL_DESTINATIONS: DiscoveryDestination[] = [
  {
    id: 'dest-perplexity',
    name: 'Perplexity AI',
    category: 'ai',
    url: 'https://www.perplexity.ai',
    host: 'perplexity.ai',
    note: 'Conversational answer engine with source citations',
    icon: 'sparkle',
  },
  {
    id: 'dest-github',
    name: 'GitHub Trending',
    category: 'reference',
    url: 'https://github.com/trending',
    host: 'github.com',
    note: 'Open source software and developer repositories',
    icon: 'code',
  },
  {
    id: 'dest-wiki',
    name: 'Wikipedia',
    category: 'reference',
    url: 'https://en.wikipedia.org/wiki/Special:Random',
    host: 'wikipedia.org',
    note: 'The free encyclopedia of human knowledge',
    icon: 'book',
  },
  {
    id: 'dest-archive',
    name: 'Internet Archive',
    category: 'media',
    url: 'https://archive.org',
    host: 'archive.org',
    note: 'Digital library of books, movies, music & websites',
    icon: 'archive',
  },
  {
    id: 'dest-hn',
    name: 'Hacker News',
    category: 'news',
    url: 'https://news.ycombinator.com',
    host: 'news.ycombinator.com',
    note: 'Curated computer science & technology stories',
    icon: 'newspaper',
  },
  {
    id: 'dest-mdn',
    name: 'MDN Web Docs',
    category: 'reference',
    url: 'https://developer.mozilla.org',
    host: 'developer.mozilla.org',
    note: 'Open web standards and JavaScript documentation',
    icon: 'fileText',
  },
];

type Props = {
  pages: CuratedPage[];
  todayLabel: string;
  history?: HistoryEntry[];
  onOpenPage: (url: string) => void;
  onSavePage?: (page: CuratedPage) => void;
  onOpenArchive: () => void;
  onOpenTrails?: () => void;
  onOpenCollections?: () => void;
};

export function DiscoverySection({
  pages,
  todayLabel,
  history = [],
  onOpenPage,
  onSavePage,
  onOpenArchive,
}: Props) {
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState<DiscoveryFilter>('all');

  const websiteOfDay = pages[0];
  const articleOfDay = pages[1] || pages[0];
  const devTool = pages[2] || pages[0];

  const handleShare = async (page: CuratedPage | { title: string; url: string }) => {
    haptic.tap();
    try {
      await Share.share({
        title: page.title,
        message: `${page.title} — ${page.url}`,
        url: page.url,
      });
    } catch {}
  };

  const editorialCards = [
    {
      badge: 'WEBSITE OF THE DAY',
      page: websiteOfDay,
      tag: todayLabel,
    },
    {
      badge: 'ARTICLE OF THE DAY',
      page: articleOfDay,
      tag: `${articleOfDay?.readMinutes || 3} min read`,
    },
    {
      badge: 'DEVELOPER DISCOVERY',
      page: devTool,
      tag: devTool?.category || 'Tool',
    },
  ].filter((item) => Boolean(item.page));

  const essayPages = pages.filter(
    (p) =>
      p.category === 'ESSAY' ||
      p.category === 'IDEA' ||
      p.category === 'CRAFT' ||
      p.category === 'READING',
  );

  const recentHistory = history
    .filter((h) => h.url && !h.url.startsWith('about:'))
    .slice(0, 6);

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
          DISCOVER TODAY
        </Text>
        <Pressable
          onPress={() => {
            haptic.tap();
            onOpenArchive();
          }}
          hitSlop={10}
          style={styles.seeAll}
        >
          <Text style={[styles.sectionAction, { color: theme.inkSoft }]}>
            Archive
          </Text>
          <Icon name="archive" size={12} color={theme.faint} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Discovery Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <PressableScale
          onPress={() => {
            haptic.select();
            setActiveFilter('all');
          }}
          style={[
            styles.filterPill,
            {
              backgroundColor: activeFilter === 'all' ? theme.surface : 'transparent',
              borderColor: activeFilter === 'all' ? theme.accent : theme.line,
            },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: activeFilter === 'all' ? theme.ink : theme.muted,
                fontFamily: activeFilter === 'all' ? fonts.semibold : fonts.sans,
              },
            ]}
          >
            Editorial Picks
          </Text>
        </PressableScale>

        <PressableScale
          onPress={() => {
            haptic.select();
            setActiveFilter('destinations');
          }}
          style={[
            styles.filterPill,
            {
              backgroundColor:
                activeFilter === 'destinations' ? theme.surface : 'transparent',
              borderColor: activeFilter === 'destinations' ? theme.accent : theme.line,
            },
          ]}
        >
          <Icon
            name="compass"
            size={11}
            color={activeFilter === 'destinations' ? theme.accent : theme.muted}
          />
          <Text
            style={[
              styles.filterText,
              {
                color: activeFilter === 'destinations' ? theme.ink : theme.muted,
                fontFamily:
                  activeFilter === 'destinations' ? fonts.semibold : fonts.sans,
              },
            ]}
          >
            Web Destinations
          </Text>
        </PressableScale>

        <PressableScale
          onPress={() => {
            haptic.select();
            setActiveFilter('essays');
          }}
          style={[
            styles.filterPill,
            {
              backgroundColor: activeFilter === 'essays' ? theme.surface : 'transparent',
              borderColor: activeFilter === 'essays' ? theme.accent : theme.line,
            },
          ]}
        >
          <Icon
            name="book"
            size={11}
            color={activeFilter === 'essays' ? theme.accent : theme.muted}
          />
          <Text
            style={[
              styles.filterText,
              {
                color: activeFilter === 'essays' ? theme.ink : theme.muted,
                fontFamily: activeFilter === 'essays' ? fonts.semibold : fonts.sans,
              },
            ]}
          >
            Essays & Ideas
          </Text>
        </PressableScale>

        {recentHistory.length > 0 ? (
          <PressableScale
            onPress={() => {
              haptic.select();
              setActiveFilter('recent');
            }}
            style={[
              styles.filterPill,
              {
                backgroundColor: activeFilter === 'recent' ? theme.surface : 'transparent',
                borderColor: activeFilter === 'recent' ? theme.accent : theme.line,
              },
            ]}
          >
            <Icon
              name="clock"
              size={11}
              color={activeFilter === 'recent' ? theme.accent : theme.muted}
            />
            <Text
              style={[
                styles.filterText,
                {
                  color: activeFilter === 'recent' ? theme.ink : theme.muted,
                  fontFamily: activeFilter === 'recent' ? fonts.semibold : fonts.sans,
                },
              ]}
            >
              Revisit Recent
            </Text>
          </PressableScale>
        ) : null}
      </ScrollView>

      {/* Content depending on Active Filter */}
      {activeFilter === 'all' ? (
        <View style={styles.cardList}>
          {editorialCards.map((item, idx) => {
            const { page } = item;
            return (
              <View
                key={page.id || idx}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.line,
                  },
                  softShadow(theme.mode, 'card'),
                ]}
              >
                <PressableScale
                  onPress={() => {
                    haptic.tap();
                    onOpenPage(page.url);
                  }}
                  scaleTo={0.99}
                  style={styles.cardContent}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.badgeText, { color: theme.accent }]}>
                      {item.badge}
                    </Text>
                    <View style={[styles.tagPill, { backgroundColor: theme.chip }]}>
                      <Text style={[styles.tagText, { color: theme.muted }]}>
                        {item.tag}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.titleRow}>
                    <Favicon host={page.host} title={page.title} size={22} plain />
                    <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.ink }]}>
                      {page.title}
                    </Text>
                  </View>

                  <Text numberOfLines={2} style={[styles.cardNote, { color: theme.muted }]}>
                    {page.note}
                  </Text>

                  <Text style={[styles.cardHost, { color: theme.faint }]}>
                    {page.host}
                  </Text>
                </PressableScale>

                <View style={[styles.cardActions, { borderTopColor: theme.line }]}>
                  <PressableScale
                    onPress={() => {
                      haptic.tap();
                      onOpenPage(page.url);
                    }}
                    style={[styles.primaryAction, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.primaryActionText}>Open</Text>
                    <Icon name="arrowUpRight" size={13} color="#FFFFFF" strokeWidth={2.2} />
                  </PressableScale>

                  <View style={styles.secondaryActions}>
                    {onSavePage ? (
                      <PressableScale
                        onPress={() => {
                          haptic.tap();
                          onSavePage(page);
                        }}
                        style={[styles.iconButton, { borderColor: theme.line }]}
                        accessibilityLabel="Save page"
                      >
                        <Icon name="bookmark" size={14} color={theme.inkSoft} strokeWidth={2} />
                      </PressableScale>
                    ) : null}

                    <PressableScale
                      onPress={() => handleShare(page)}
                      style={[styles.iconButton, { borderColor: theme.line }]}
                      accessibilityLabel="Share page"
                    >
                      <Icon name="share" size={14} color={theme.inkSoft} strokeWidth={2} />
                    </PressableScale>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : activeFilter === 'destinations' ? (
        <View style={styles.destinationsGrid}>
          {USEFUL_DESTINATIONS.map((dest) => (
            <PressableScale
              key={dest.id}
              onPress={() => {
                haptic.tap();
                onOpenPage(dest.url);
              }}
              scaleTo={0.97}
              style={[
                styles.destinationCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.destTopRow}>
                <View
                  style={[
                    styles.destIconOrb,
                    { backgroundColor: theme.accentSoft },
                  ]}
                >
                  <Icon name={dest.icon} size={15} color={theme.accent} strokeWidth={2} />
                </View>
                <View style={[styles.destBadge, { backgroundColor: theme.chip }]}>
                  <Text style={[styles.destBadgeText, { color: theme.muted }]}>
                    {dest.category.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text numberOfLines={1} style={[styles.destTitle, { color: theme.ink }]}>
                {dest.name}
              </Text>
              <Text numberOfLines={2} style={[styles.destNote, { color: theme.muted }]}>
                {dest.note}
              </Text>
              <Text style={[styles.destHost, { color: theme.faint }]}>
                {dest.host}
              </Text>
            </PressableScale>
          ))}
        </View>
      ) : activeFilter === 'essays' ? (
        <View style={styles.cardList}>
          {essayPages.slice(0, 4).map((page) => (
            <PressableScale
              key={page.id}
              onPress={() => {
                haptic.tap();
                onOpenPage(page.url);
              }}
              scaleTo={0.985}
              style={[
                styles.essayCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.essayTop}>
                <View style={[styles.tagPill, { backgroundColor: theme.chip }]}>
                  <Text style={[styles.tagText, { color: theme.muted }]}>
                    {page.category} · {page.readMinutes}m
                  </Text>
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.ink, marginTop: 4 }]}>
                {page.title}
              </Text>
              <Text numberOfLines={2} style={[styles.cardNote, { color: theme.muted }]}>
                {page.note}
              </Text>
              <Text style={[styles.cardHost, { color: theme.faint }]}>{page.host}</Text>
            </PressableScale>
          ))}
        </View>
      ) : (
        /* Recent History Shelf */
        <View style={styles.destinationsGrid}>
          {recentHistory.map((entry) => (
            <PressableScale
              key={entry.id}
              onPress={() => {
                haptic.tap();
                onOpenPage(entry.url);
              }}
              scaleTo={0.97}
              style={[
                styles.destinationCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.destTopRow}>
                <Favicon host={entry.host} title={entry.title} size={24} plain />
                <Icon name="clock" size={12} color={theme.faint} />
              </View>
              <Text numberOfLines={1} style={[styles.destTitle, { color: theme.ink }]}>
                {entry.title || entry.host}
              </Text>
              <Text numberOfLines={1} style={[styles.destHost, { color: theme.muted }]}>
                {entry.host}
              </Text>
            </PressableScale>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
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
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 13,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11.5,
  },
  cardList: {
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    letterSpacing: 1,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  cardNote: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18.5,
    marginBottom: 8,
  },
  cardHost: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  primaryActionText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  destinationCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 5,
  },
  destTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  destIconOrb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  destBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  destTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  destNote: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  destHost: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    marginTop: 2,
  },
  essayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  essayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
