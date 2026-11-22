import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Favicon } from '../Favicon';
import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { haptic } from '@/lib/haptics';
import { relativeTime } from '@/lib/time';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { HistoryEntry } from '@/types';

type Props = {
  history: HistoryEntry[];
  onOpenPage: (url: string) => void;
  onOpenHistory: () => void;
  onRemoveItem?: (id: string) => void;
};

export function ContinueReading({
  history,
  onOpenPage,
  onOpenHistory,
  onRemoveItem,
}: Props) {
  const { theme } = useTheme();
  const recent = history.slice(0, 4);

  if (recent.length === 0) return null;

  const handleShare = async (item: HistoryEntry) => {
    haptic.tap();
    try {
      await Share.share({
        title: item.title,
        message: `${item.title} — ${item.url}`,
        url: item.url,
      });
    } catch {}
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
          CONTINUE READING
        </Text>
        <Pressable
          onPress={() => {
            haptic.tap();
            onOpenHistory();
          }}
          hitSlop={10}
          style={styles.seeAll}
          accessibilityRole="button"
          accessibilityLabel="Open browsing history"
        >
          <Text style={[styles.sectionAction, { color: theme.inkSoft }]}>
            All history
          </Text>
          <Icon name="chevronRight" size={13} color={theme.faint} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {recent.map((item) => (
          <PressableScale
            key={item.id}
            onPress={() => {
              haptic.tap();
              onOpenPage(item.url);
            }}
            scaleTo={0.985}
            style={[
              styles.itemCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.line,
              },
              softShadow(theme.mode, 'card'),
            ]}
            accessibilityLabel={`${item.title}, visited ${relativeTime(item.visitedAt)}`}
          >
            <Favicon host={item.host} title={item.title} size={28} />

            <View style={styles.itemCopy}>
              <Text numberOfLines={1} style={[styles.itemTitle, { color: theme.ink }]}>
                {item.title || item.host}
              </Text>
              <Text numberOfLines={1} style={[styles.itemMeta, { color: theme.muted }]}>
                {item.host} · {relativeTime(item.visitedAt)}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleShare(item);
                }}
                hitSlop={8}
                style={[styles.smallBtn, { backgroundColor: theme.chip }]}
                accessibilityLabel="Share link"
              >
                <Icon name="share" size={12} color={theme.inkSoft} strokeWidth={2} />
              </Pressable>

              {onRemoveItem ? (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    haptic.tap();
                    onRemoveItem(item.id);
                  }}
                  hitSlop={8}
                  style={[styles.smallBtn, { backgroundColor: theme.chip }]}
                  accessibilityLabel="Remove from recent"
                >
                  <Icon name="close" size={10} color={theme.muted} strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </View>
          </PressableScale>
        ))}
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
  list: {
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  itemMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
