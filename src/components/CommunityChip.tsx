import { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  communityPlatformLabel,
  formatCommunityCount,
} from '@/lib/community';
import { haptic } from '@/lib/haptics';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { CommunityThread } from '@/types';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  threads: CommunityThread[];
  onPress: () => void;
};

/**
 * A small, quiet entrance to the public conversation around the page. It sits
 * above the toolbar rather than inside it so the address bar keeps its full
 * width and the page remains the focus.
 */
export function CommunityChip({ threads, onPress }: Props) {
  const { theme } = useTheme();
  const animation = useAnimatedValue(0);
  const primary = threads[0] ?? null;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 5,
    }).start();
  }, [animation]);

  if (!primary) return null;

  const tint = primary.platform === 'hn' ? theme.accent : theme.danger;
  const shortLabel = primary.platform === 'hn' ? 'HN' : 'Lobsters';
  const extra = threads.slice(1).map((thread) => communityPlatformLabel(thread.platform));

  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}
    >
      <PressableScale
        onPress={() => {
          haptic.tap();
          onPress();
        }}
        scaleTo={0.97}
        style={[
          styles.chip,
          { backgroundColor: theme.surface, borderColor: theme.line },
          softShadow(theme.mode, 'card'),
        ]}
        accessibilityLabel={`${communityPlatformLabel(primary.platform)} discussion, ${formatCommunityCount(primary.points)} points, ${formatCommunityCount(primary.commentsCount)} comments${extra.length > 0 ? `, also on ${extra.join(' and ')}` : ''}`}
        accessibilityHint="Opens the public thread without leaving this page"
      >
        <View style={[styles.mark, { backgroundColor: theme.chip }]}>
          <Icon name="message" size={12} color={tint} strokeWidth={2} />
        </View>
        <Text style={[styles.platform, { color: tint }]}>{shortLabel}</Text>
        <Text style={[styles.stat, { color: theme.inkSoft }]}>
          {formatCommunityCount(primary.points)} pts
        </Text>
        <View style={[styles.dot, { backgroundColor: theme.faint }]} />
        <Text style={[styles.stat, { color: theme.inkSoft }]}>
          {formatCommunityCount(primary.commentsCount)} comments
        </Text>
        {extra.length > 0 ? (
          <Text style={[styles.extra, { color: theme.muted }]}>
            +{extra.length}
          </Text>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 30,
    maxWidth: '100%',
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platform: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  stat: {
    fontFamily: fonts.medium,
    fontSize: 11,
    includeFontPadding: false,
  },
  dot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },
  extra: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    includeFontPadding: false,
  },
});
