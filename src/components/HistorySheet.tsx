import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { haptic } from '@/lib/haptics';
import { clockTime, groupHistory, relativeTime } from '@/lib/time';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { HistoryEntry } from '@/types';
import { BottomSheet } from './BottomSheet';
import { Favicon } from './Favicon';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onOpen: (url: string) => void;
  onClear: () => void;
};

export function HistorySheet({ visible, onClose, history, onOpen, onClear }: Props) {
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groups = groupHistory(history);

  useEffect(() => {
    if (!visible) {
      setConfirming(false);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    }
  }, [visible]);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );

  const requestClear = () => {
    if (!confirming) {
      haptic.warn();
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirming(false);
    haptic.success();
    onClear();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: theme.ink }]}>History</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Remembered only on this device.
          </Text>
        </View>
        <IconButton
          icon="close"
          label="Close history"
          variant="surface"
          size={36}
          iconSize={16}
          onPress={onClose}
        />
      </View>

      {history.length > 0 ? (
        <View style={styles.toolbarRow}>
          <Text style={[styles.count, { color: theme.faint }]}>
            {history.length} {history.length === 1 ? 'page' : 'pages'}
          </Text>
          <Pressable
            onPress={requestClear}
            style={[
              styles.clearButton,
              {
                backgroundColor: confirming ? theme.accent : theme.chip,
                borderColor: confirming ? theme.accent : theme.line,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={confirming ? 'Confirm clear history' : 'Clear history'}
          >
            <Text
              style={[
                styles.clearText,
                { color: confirming ? theme.accentInk : theme.inkSoft },
              ]}
            >
              {confirming ? 'Tap again to clear' : 'Clear history'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={{ maxHeight: height * 0.6 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyOrb, { backgroundColor: theme.chip }]}>
              <Icon name="clock" size={25} color={theme.inkSoft} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.ink }]}>
              Nothing here yet
            </Text>
            <Text style={[styles.emptyBody, { color: theme.muted }]}>
              The pages you open will appear here — on this device, and nowhere else.
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={[styles.groupLabel, { color: theme.muted }]}>
                {group.title.toUpperCase()}
              </Text>
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.line },
                ]}
              >
                {group.entries.map((entry, index) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => {
                      haptic.tap();
                      onOpen(entry.url);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      index > 0
                        ? {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: theme.line,
                          }
                        : null,
                      pressed ? { opacity: 0.65 } : null,
                    ]}
                    accessibilityRole="link"
                    accessibilityLabel={`Open ${entry.title}`}
                  >
                    <Favicon host={entry.host} title={entry.title} size={34} />
                    <View style={styles.rowCopy}>
                      <Text
                        numberOfLines={1}
                        style={[styles.rowTitle, { color: theme.ink }]}
                      >
                        {entry.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.rowMeta, { color: theme.muted }]}
                      >
                        {entry.host} · {metaFor(entry, group.title)}
                      </Text>
                    </View>
                    <Icon
                      name="arrowUpRight"
                      size={14}
                      color={theme.faint}
                      strokeWidth={1.9}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </BottomSheet>
  );
}

function metaFor(entry: HistoryEntry, group: string): string {
  if (group === 'Earlier') {
    const date = new Date(entry.visitedAt);
    if (Date.now() - entry.visitedAt < 7 * 86_400_000) {
      return relativeTime(entry.visitedAt);
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return clockTime(entry.visitedAt);
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  count: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  clearButton: {
    paddingHorizontal: 11,
    height: 29,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  clearText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  group: {
    marginBottom: 20,
  },
  groupLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 58,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  rowMeta: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  empty: {
    paddingTop: 24,
    paddingBottom: 34,
    paddingHorizontal: 26,
    alignItems: 'center',
  },
  emptyOrb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 27,
    letterSpacing: -0.4,
  },
  emptyBody: {
    marginTop: 7,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 300,
  },
});
