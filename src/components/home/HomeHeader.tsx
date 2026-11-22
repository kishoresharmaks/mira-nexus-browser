import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../BrandMark';
import { IconButton } from '../IconButton';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  onOpenAi: () => void;
  onOpenHistory: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
};

export function HomeHeader({
  onOpenAi,
  onOpenHistory,
  onToggleTheme,
  onOpenSettings,
}: Props) {
  const { theme, mode } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <BrandMark
          size={24}
          color={theme.ink}
          accent={theme.accent}
          strokeWidth={1.65}
        />
        <Text style={[styles.wordmark, { color: theme.ink }]}>Nexus</Text>
      </View>

      <View style={styles.actions}>
        <IconButton
          icon="sparkle"
          label="Nexus AI Assistant"
          variant="surface"
          size={38}
          iconSize={18}
          color={theme.accent}
          onPress={onOpenAi}
        />
        <IconButton
          icon="clock"
          label="Browsing history"
          variant="surface"
          size={38}
          iconSize={18}
          onPress={onOpenHistory}
        />
        <IconButton
          icon={mode === 'dark' ? 'sun' : 'moon'}
          label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          variant="surface"
          size={38}
          iconSize={18}
          onPress={onToggleTheme}
        />
        <IconButton
          icon="settings"
          label="Browser settings"
          variant="surface"
          size={38}
          iconSize={18}
          onPress={onOpenSettings}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
