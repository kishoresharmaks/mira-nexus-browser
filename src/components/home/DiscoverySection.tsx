import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Favicon } from '../Favicon';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { CuratedPage } from '@/types';

type Props = {
  pages: CuratedPage[];
  todayLabel: string;
  onOpenPage: (url: string) => void;
  onSavePage?: (page: CuratedPage) => void;
  onOpenArchive: () => void;
};

export function DiscoverySection({
  pages,
  todayLabel,
  onOpenPage,
  onSavePage,
  onOpenArchive,
}: Props) {
  const { theme } = useTheme();

  // Distinct discovery picks from the curated collection
  const websiteOfDay = pages[0];
  const articleOfDay = pages[1] || pages[0];
  const devTool = pages[2] || pages[0];

  const handleShare = async (page: CuratedPage) => {
    haptic.tap();
    try {
      await Share.share({
        title: page.title,
        message: `${page.title} — ${page.url}`,
        url: page.url,
      });
    } catch {}
  };

  const cards = [
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

  return (
    <View style={styles.section}>
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

      <View style={styles.cardList}>
        {cards.map((item, idx) => {
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
                {/* Header with Badge & Tag */}
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

                {/* Title & Domain */}
                <View style={styles.titleRow}>
                  <Favicon host={page.host} title={page.title} size={22} plain />
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.ink }]}>
                    {page.title}
                  </Text>
                </View>

                {/* Short Description */}
                <Text numberOfLines={2} style={[styles.cardNote, { color: theme.muted }]}>
                  {page.note}
                </Text>

                <Text style={[styles.cardHost, { color: theme.faint }]}>
                  {page.host}
                </Text>
              </PressableScale>

              {/* Bottom Actions Row */}
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
    marginBottom: 12,
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
});
