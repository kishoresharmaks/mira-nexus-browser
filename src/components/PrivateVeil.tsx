import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, privateTheme } from '@/theme';
import { Icon } from './Icon';

const T = privateTheme;

/**
 * Last line of defence while the app is in the background. The OS shield stops
 * the screenshot itself on native builds; this cover keeps the app-switcher
 * snapshot quiet on devices and preview environments without that support.
 */
export function PrivateVeil() {
  return (
    <View style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={['#0B0E15', '#07090D']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb}>
        <Icon name="mask" size={32} color={T.accent} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>Private tab</Text>
      <Text style={styles.copy}>Hidden while Nexus is away</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.bg,
  },
  orb: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(143, 168, 255, 0.26)',
  },
  title: {
    marginTop: 20,
    fontFamily: fonts.serif,
    fontSize: 30,
    letterSpacing: -0.5,
    color: T.ink,
    includeFontPadding: false,
  },
  copy: {
    marginTop: 6,
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: 0.2,
    color: T.muted,
  },
});
