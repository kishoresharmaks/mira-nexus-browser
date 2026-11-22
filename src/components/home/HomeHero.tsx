import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export function HomeHero() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  // Responsive display sizing keeping the editorial balance
  const displaySize = Math.min(58, Math.max(42, width * 0.128));

  return (
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
            lineHeight: displaySize * 0.96,
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
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: 26,
    paddingHorizontal: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  eyebrowLine: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  headline: {
    fontFamily: fonts.serif,
    letterSpacing: -1.2,
    includeFontPadding: false,
  },
  headlineItalic: {
    fontStyle: 'italic',
  },
  subline: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 320,
  },
});
