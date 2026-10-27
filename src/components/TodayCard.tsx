import { StyleSheet, Text, View } from 'react-native';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { CuratedPage } from '@/types';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

/**
 * The one editorial moment on the home screen: an inverse card that reads like
 * the cover of a small magazine, not a feed item.
 */
export function TodayCard({
  page,
  dateLabel,
  onPress,
  roomy = false,
}: {
  page: CuratedPage;
  dateLabel: string;
  onPress: () => void;
  roomy?: boolean;
}) {
  const { theme } = useTheme();
  const muted =
    theme.mode === 'dark'
      ? 'rgba(22, 19, 14, 0.62)'
      : 'rgba(247, 242, 232, 0.64)';
  const rule =
    theme.mode === 'dark'
      ? 'rgba(22, 19, 14, 0.14)'
      : 'rgba(247, 242, 232, 0.16)';

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      style={[
        styles.card,
        roomy ? styles.cardRoomy : null,
        { backgroundColor: theme.inverse },
        softShadow(theme.mode, 'dock'),
      ]}
      accessibilityLabel={`Today's page: ${page.title} on ${page.host}`}
      accessibilityHint="Opens the page in a new tab"
    >
      <View style={styles.topRow}>
        <View style={styles.eyebrowRow}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.eyebrow, { color: theme.accent }]}>
            TODAY&apos;S PAGE
          </Text>
        </View>
        <Text style={[styles.date, { color: muted }]}>{dateLabel}</Text>
      </View>

      <View style={[styles.rule, { backgroundColor: rule }]} />

      <Text style={[styles.category, { color: theme.accent }]}>
        {page.category}
      </Text>
      <Text
        style={[
          styles.title,
          roomy ? styles.titleRoomy : null,
          { color: theme.inverseInk },
        ]}
      >
        {page.title}
      </Text>
      <Text style={[styles.note, { color: muted }]}>{page.note}</Text>

      <View style={styles.footer}>
        <View style={styles.metaWrap}>
          <Text
            numberOfLines={1}
            style={[styles.meta, { color: theme.inverseInk }]}
          >
            {page.host}
          </Text>
          <Text style={[styles.metaSoft, { color: muted }]}>
            {' '}
            · {page.readMinutes} min read
          </Text>
        </View>
        <View style={[styles.go, { backgroundColor: theme.accent }]}>
          <Icon
            name="arrowUpRight"
            size={16}
            color={theme.accentInk}
            strokeWidth={2.1}
          />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  cardRoomy: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.55,
  },
  date: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginTop: 14,
    marginBottom: 16,
  },
  category: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 31,
    lineHeight: 33,
    letterSpacing: -0.55,
    includeFontPadding: false,
  },
  titleRoomy: {
    fontSize: 35,
    lineHeight: 37,
  },
  note: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 9,
  },
  footer: {
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    flexShrink: 1,
  },
  metaSoft: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  go: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
