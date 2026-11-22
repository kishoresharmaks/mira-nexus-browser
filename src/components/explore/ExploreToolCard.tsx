import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export type ToolItem = {
  id: string;
  title: string;
  description: string;
  category: 'search' | 'productivity' | 'reading' | 'developer' | 'files' | 'privacy';
  icon: IconName;
  badge?: string;
  onPress: () => void;
};

type Props = {
  tool: ToolItem;
};

export function ExploreToolCard({ tool }: Props) {
  const { theme } = useTheme();

  return (
    <PressableScale
      onPress={() => {
        haptic.tap();
        tool.onPress();
      }}
      scaleTo={0.97}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
        softShadow(theme.mode, 'card'),
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${tool.title}, ${tool.description}`}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconOrb, { backgroundColor: theme.chip }]}>
          <Icon name={tool.icon} size={17} color={theme.accent} strokeWidth={2} />
        </View>

        {tool.badge && (
          <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.badgeText, { color: theme.accent }]}>
              {tool.badge}
            </Text>
          </View>
        )}
      </View>

      <Text numberOfLines={1} style={[styles.title, { color: theme.ink }]}>
        {tool.title}
      </Text>

      <Text numberOfLines={2} style={[styles.description, { color: theme.muted }]}>
        {tool.description}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 145,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconOrb: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 15,
  },
});
