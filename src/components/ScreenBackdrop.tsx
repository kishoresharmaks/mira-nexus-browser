import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { softShadow, type ThemeMode } from '@/theme';

export function ScreenBackdrop({ mode }: { mode?: ThemeMode }) {
  const { theme, mode: activeMode } = useTheme();
  const resolvedMode = mode ?? activeMode;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={theme.gradient}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="miraGlow" cx="82%" cy="4%" r="70%">
            <Stop
              offset="0"
              stopColor={theme.accent}
              stopOpacity={resolvedMode === 'light' ? 0.11 : 0.16}
            />
            <Stop offset="1" stopColor={theme.accent} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="miraCool" cx="8%" cy="88%" r="60%">
            <Stop
              offset="0"
              stopColor={theme.ink}
              stopOpacity={resolvedMode === 'light' ? 0.045 : 0.08}
            />
            <Stop offset="1" stopColor={theme.ink} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#miraGlow)" />
        <Rect width="100%" height="100%" fill="url(#miraCool)" />
      </Svg>
    </View>
  );
}

export function GlassSurfaceShadow({ mode }: { mode?: ThemeMode }) {
  return softShadow(mode ?? 'light');
}

export function Dot({ color, size = 5 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8">
      <Circle cx="4" cy="4" r="3.2" fill={color} />
    </Svg>
  );
}
