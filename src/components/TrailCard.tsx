import { StyleSheet, Text, View } from 'react-native';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Trail } from '@/types';
import {
  trailDateLabel,
  trailDurationLabel,
  trailPageLabel,
  trailTimeRange,
  trailTitle,
} from '@/lib/trails';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { TrailDots } from './TrailDots';

export function TrailCard({
  trail,
  onPress,
  onOpenAll,
}: {
  trail: Trail;
  onPress: () => void;
  onOpenAll: () => void;
}) {
  const { theme } = useTheme();
  const last = trail.pages[trail.pages.length - 1];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.line },
        softShadow(theme.mode),
      ]}
    >
      <PressableScale
        onPress={onPress}
        scaleTo={0.987}
        style={styles.body}
        accessibilityLabel={`Resume trail ${trailTitle(trail)}`}
        accessibilityHint={
          last ? `Continues at ${last.title}` : 'Opens the latest page'
        }
      >
        <View style={styles.head}>
          <View style={[styles.orb, { backgroundColor: theme.accentSoft }]}>
            <Icon name="trail" size={18} color={theme.accent} strokeWidth={1.8} />
          </View>
          <View style={styles.headCopy}>
            <Text style={[styles.eyebrow, { color: theme.muted }]}>
              LATEST TRAIL
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: theme.ink }]}
            >
              {trailTitle(trail)}
            </Text>
          </View>
          <View style={[styles.go, { backgroundColor: theme.chip }]}>
            <Icon
              name="arrowUpRight"
              size={15}
              color={theme.inkSoft}
              strokeWidth={2}
            />
          </View>
        </View>

        <View style={styles.dots}>
          <TrailDots pages={trail.pages} max={18} />
        </View>

        <View style={styles.meta}>
          <Text numberOfLines={1} style={[styles.metaText, { color: theme.muted }]}>
            {trailDateLabel(trail)} · {trailTimeRange(trail)}
          </Text>
          <Text style={[styles.metaText, { color: theme.faint }]}>
            {trailPageLabel(trail.pages.length)} · {trailDurationLabel(trail)}
          </Text>
        </View>
      </PressableScale>

      <View style={[styles.footer, { borderTopColor: theme.line }]}>
        <Text numberOfLines={1} style={[styles.lastPage, { color: theme.muted }]}>
          Last: {last?.title ?? 'No pages'}
        </Text>
        <PressableScale
          onPress={onOpenAll}
          scaleTo={0.96}
          style={styles.all}
          accessibilityLabel="See all trails"
        >
          <Text style={[styles.allText, { color: theme.accent }]}>
            All trails
          </Text>
          <Icon
            name="chevronRight"
            size={12}
            color={theme.accent}
            strokeWidth={2.2}
          />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 13,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  orb: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headCopy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.45,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 25,
    lineHeight: 27,
    letterSpacing: -0.25,
    includeFontPadding: false,
  },
  go: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    marginTop: 15,
    marginBottom: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lastPage: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  all: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingVertical: 2,
  },
  allText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
});
