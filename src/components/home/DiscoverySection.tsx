import {
  Image,
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
import { useDiscovery } from '@/lib/discovery/DiscoveryProvider';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { DiscoveryItem, HistoryEntry } from '@/types';

type Props = {
  todayLabel: string;
  history?: HistoryEntry[];
  onOpenPage: (url: string) => void;
  onSavePage?: (item: DiscoveryItem) => void;
  onOpenArchive: () => void;
};

export function DiscoverySection({
  todayLabel,
  history = [],
  onOpenPage,
  onSavePage,
  onOpenArchive,
}: Props) {
  const { theme } = useTheme();
  const {
    items,
    categories,
    activeFilter,
    setActiveFilter,
    filteredItems,
    dailySlots,
    isOffline,
    refreshing,
    refresh,
  } = useDiscovery();

  const handleShare = async (item: DiscoveryItem) => {
    haptic.tap();
    try {
      await Share.share({
        title: item.title,
        message: `${item.title} — ${item.url}`,
        url: item.url,
      });
    } catch {}
  };

  // Recent history filtered for safety: exclude internal and private addresses
  const recentHistory = history
    .filter(
      (h) =>
        h.url &&
        !h.url.startsWith('about:') &&
        !h.url.startsWith('javascript:') &&
        !h.url.startsWith('chrome:'),
    )
    .slice(0, 6);

  // Daily editorial cards for the 'all' view
  const editorialCards = [
    dailySlots.websiteOfDay && {
      badge: 'WEBSITE OF THE DAY',
      item: dailySlots.websiteOfDay,
      tag: todayLabel,
    },
    dailySlots.articleOfDay && {
      badge: 'ARTICLE OF THE DAY',
      item: dailySlots.articleOfDay,
      tag: `${dailySlots.articleOfDay.readMinutes || 5} min read`,
    },
    dailySlots.developerDiscovery && {
      badge: 'DEVELOPER DISCOVERY',
      item: dailySlots.developerDiscovery,
      tag: dailySlots.developerDiscovery.contentType || 'Tool',
    },
  ].filter((c): c is { badge: string; item: DiscoveryItem; tag: string } => Boolean(c));

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            DISCOVER TODAY
          </Text>
          {isOffline && items.length > 0 ? (
            <View style={[styles.offlineBadge, { backgroundColor: theme.chip }]}>
              <Icon name="wifiOff" size={10} color={theme.faint} />
              <Text style={[styles.offlineText, { color: theme.faint }]}>
                Cached
              </Text>
            </View>
          ) : null}
        </View>

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

      {/* Dynamic Discovery Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {/* All / Editorial Picks Pill */}
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
          <Icon
            name="sparkle"
            size={11}
            color={activeFilter === 'all' ? theme.accent : theme.muted}
          />
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

        {/* Dynamic Categories from Backend */}
        {categories
          .filter((cat) => cat.enabled !== false)
          .map((cat) => {
            const isSelected = activeFilter === cat.id;
            const iconName = (cat.icon || 'compass') as IconName;
            return (
              <PressableScale
                key={cat.id}
                onPress={() => {
                  haptic.select();
                  setActiveFilter(cat.id);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? theme.surface : 'transparent',
                    borderColor: isSelected ? theme.accent : theme.line,
                  },
                ]}
              >
                <Icon
                  name={iconName}
                  size={11}
                  color={isSelected ? theme.accent : theme.muted}
                />
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isSelected ? theme.ink : theme.muted,
                      fontFamily: isSelected ? fonts.semibold : fonts.sans,
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </PressableScale>
            );
          })}

        {/* Local Revisit Recent Pill */}
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

      {/* Main Content Area */}
      {items.length === 0 ? (
        /* Empty / Offline State (No fake fallback recommendations) */
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
            softShadow(theme.mode, 'card'),
          ]}
        >
          <View style={[styles.emptyOrb, { backgroundColor: theme.chip }]}>
            <Icon
              name={isOffline ? 'wifiOff' : 'compass'}
              size={22}
              color={theme.accent}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>
            {isOffline
              ? 'No Cached Discovery Content'
              : 'Discovery Feed Updating'}
          </Text>
          <Text style={[styles.emptyNote, { color: theme.muted }]}>
            {isOffline
              ? 'Connect to the internet to fetch published editorial recommendations and daily articles.'
              : 'Published editorial picks will appear here as soon as synchronized from the server.'}
          </Text>
          <PressableScale
            onPress={() => {
              haptic.tap();
              void refresh();
            }}
            style={[styles.retryBtn, { backgroundColor: theme.accent }]}
            disabled={refreshing}
          >
            <Text style={[styles.retryBtnText, { color: '#FFFFFF' }]}>
              {refreshing ? 'Refreshing...' : 'Retry Connection'}
            </Text>
            <Icon name="refresh" size={12} color="#FFFFFF" />
          </PressableScale>
        </View>
      ) : activeFilter === 'recent' ? (
        /* Local Revisit Recent Grid */
        <View style={styles.grid}>
          {recentHistory.map((entry) => (
            <PressableScale
              key={entry.id}
              onPress={() => {
                haptic.tap();
                onOpenPage(entry.url);
              }}
              scaleTo={0.97}
              style={[
                styles.recentCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                },
                softShadow(theme.mode, 'card'),
              ]}
            >
              <View style={styles.recentTopRow}>
                <Favicon host={entry.host} title={entry.title} size={22} plain />
                <Icon name="clock" size={11} color={theme.faint} />
              </View>
              <Text numberOfLines={1} style={[styles.recentTitle, { color: theme.ink }]}>
                {entry.title || entry.host}
              </Text>
              <Text numberOfLines={1} style={[styles.recentHost, { color: theme.muted }]}>
                {entry.host}
              </Text>
            </PressableScale>
          ))}
        </View>
      ) : activeFilter === 'all' ? (
        /* Editorial Picks / Daily Featured Cards */
        <View style={styles.cardList}>
          {editorialCards.map((card, idx) => {
            const { item } = card;
            return (
              <View
                key={item.id || idx}
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
                    onOpenPage(item.url);
                  }}
                  scaleTo={0.99}
                  style={styles.cardContent}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.badgeText, { color: theme.accent }]}>
                      {card.badge}
                    </Text>
                    <View style={[styles.tagPill, { backgroundColor: theme.chip }]}>
                      <Text style={[styles.tagText, { color: theme.muted }]}>
                        {card.tag}
                      </Text>
                    </View>
                  </View>

                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.coverImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  <View style={styles.titleRow}>
                    <Favicon host={item.host} title={item.title} size={22} plain />
                    <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.ink }]}>
                      {item.title}
                    </Text>
                  </View>

                  <Text numberOfLines={2} style={[styles.cardNote, { color: theme.muted }]}>
                    {item.note}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={[styles.cardHost, { color: theme.faint }]}>
                      {item.host}
                    </Text>
                    {item.author ? (
                      <Text style={[styles.cardAuthor, { color: theme.muted }]}>
                        by {item.author}
                      </Text>
                    ) : null}
                  </View>
                </PressableScale>

                <View style={[styles.cardActions, { borderTopColor: theme.line }]}>
                  <PressableScale
                    onPress={() => {
                      haptic.tap();
                      onOpenPage(item.url);
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
                          onSavePage(item);
                        }}
                        style={[styles.iconButton, { borderColor: theme.line }]}
                        accessibilityLabel="Save page"
                      >
                        <Icon name="bookmark" size={14} color={theme.inkSoft} strokeWidth={2} />
                      </PressableScale>
                    ) : null}

                    <PressableScale
                      onPress={() => handleShare(item)}
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
      ) : (
        /* Categorized Items List */
        <View style={styles.cardList}>
          {filteredItems.length === 0 ? (
            <View style={[styles.emptyCategory, { borderColor: theme.line }]}>
              <Text style={[styles.emptyCategoryText, { color: theme.muted }]}>
                No items published under this category yet.
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <PressableScale
                key={item.id}
                onPress={() => {
                  haptic.tap();
                  onOpenPage(item.url);
                }}
                scaleTo={0.985}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.line,
                  },
                  softShadow(theme.mode, 'card'),
                ]}
              >
                <View style={styles.categoryCardTop}>
                  <View style={[styles.tagPill, { backgroundColor: theme.chip }]}>
                    <Text style={[styles.tagText, { color: theme.muted }]}>
                      {item.category} {item.readMinutes ? `· ${item.readMinutes}m` : ''}
                    </Text>
                  </View>
                  <Icon name="arrowUpRight" size={12} color={theme.faint} />
                </View>

                <View style={styles.titleRow}>
                  <Favicon host={item.host} title={item.title} size={18} plain />
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.ink }]}>
                    {item.title}
                  </Text>
                </View>

                <Text numberOfLines={2} style={[styles.cardNote, { color: theme.muted }]}>
                  {item.note}
                </Text>

                <Text style={[styles.cardHost, { color: theme.faint }]}>
                  {item.host}
                </Text>
              </PressableScale>
            ))
          )}
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offlineText: {
    fontFamily: fonts.sans,
    fontSize: 9.5,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11.5,
  },
  cardList: {
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  coverImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14.5,
  },
  cardNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHost: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  cardAuthor: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  primaryActionText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
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
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  recentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentTitle: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    marginBottom: 2,
  },
  recentHost: {
    fontFamily: fonts.sans,
    fontSize: 10,
  },
  categoryCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  emptyOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  retryBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  emptyCategory: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCategoryText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
});
