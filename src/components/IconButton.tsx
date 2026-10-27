import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { softShadow } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

export function IconButton({
  icon,
  onPress,
  label,
  size = 40,
  iconSize = 19,
  variant = 'ghost',
  disabled = false,
  color,
  onLongPress,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  iconSize?: number;
  variant?: 'ghost' | 'surface';
  disabled?: boolean;
  color?: string;
  onLongPress?: () => void;
}) {
  const { theme } = useTheme();
  const surface = variant === 'surface';

  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={undefined}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: surface ? theme.surface : 'transparent',
          borderWidth: surface ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.line,
        },
        surface ? softShadow(theme.mode) : null,
      ]}
    >
      <View pointerEvents="none">
        <Icon
          name={icon}
          size={iconSize}
          color={color ?? (disabled ? theme.faint : theme.ink)}
          strokeWidth={1.8}
        />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
