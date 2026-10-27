import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { TrailPage } from '@/types';

/**
 * A trail's shape at a glance: one dot per page, the newest page in accent.
 * Long trails are trimmed from the left and summarized rather than squeezed.
 */
export function TrailDots({
  pages,
  max = 18,
  size = 5,
  showOverflow = true,
}: {
  pages: TrailPage[];
  max?: number;
  size?: number;
  showOverflow?: boolean;
}) {
  const { theme } = useTheme();
  if (pages.length === 0) return null;

  const visible = pages.slice(-max);
  const overflow = pages.length - visible.length;

  return (
    <View style={styles.row} accessibilityLabel={`${pages.length} pages in this trail`}>
      {overflow > 0 && showOverflow ? (
        <Text style={[styles.overflow, { color: theme.faint }]}>+{overflow}</Text>
      ) : null}
      {visible.map((page, index) => {
        const current = index === visible.length - 1;
        const weight =
          visible.length === 1 ? 1 : 0.24 + (index / (visible.length - 1)) * 0.5;
        return (
          <View
            key={`${page.id}-${index}`}
            style={[
              styles.dot,
              {
                width: current ? size + 2.5 : size,
                height: current ? size + 2.5 : size,
                borderRadius: (size + 2.5) / 2,
                backgroundColor: current ? theme.accent : theme.ink,
                opacity: current ? 1 : weight,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5.5,
    flexWrap: 'wrap',
  },
  dot: {
    alignSelf: 'center',
  },
  overflow: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    marginRight: 1,
  },
});
