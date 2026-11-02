import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { BrandMark } from './BrandMark';

type Props = {
  /** Storage and the saved catalog are ready; the app can take over. */
  ready: boolean;
  onFinish: () => void;
};

/**
 * The short bridge between the native splash and the home screen. It is not a
 * fake progress screen: the bar keeps moving for the brief moment it is visible,
 * and the screen leaves as soon as the saved theme and catalog are hydrated.
 */
export function LaunchScreen({ ready, onFinish }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [reduceMotion, setReduceMotion] = useState(false);
  const intro = useAnimatedValue(0);
  const detail = useAnimatedValue(0);
  const progress = useAnimatedValue(0);
  const exit = useAnimatedValue(0);
  const finished = useRef(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (alive) setReduceMotion(enabled);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      intro.setValue(1);
      detail.setValue(1);
      progress.setValue(0.5);
      return;
    }

    const entrance = Animated.parallel([
      Animated.timing(intro, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(detail, {
        toValue: 1,
        duration: 520,
        delay: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    entrance.start();

    const sweep = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1_350,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    const startSweep = setTimeout(() => sweep.start(), 180);

    return () => {
      entrance.stop();
      sweep.stop();
      clearTimeout(startSweep);
    };
  }, [detail, intro, progress, reduceMotion]);

  useEffect(() => {
    if (!ready || finished.current) return;
    finished.current = true;

    Animated.timing(exit, {
      toValue: 1,
      duration: reduceMotion ? 160 : 360,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished: completed }) => {
      if (completed) onFinish();
    });
  }, [exit, onFinish, ready, reduceMotion]);

  const barTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-34, 72],
  });
  const entranceStyle = {
    opacity: intro,
    transform: [
      {
        translateY: intro.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        {
          backgroundColor: theme.bg,
          opacity: exit.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        },
      ]}
      accessibilityLabel="Mira is loading"
      accessibilityViewIsModal
      pointerEvents="auto"
    >
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.View style={entranceStyle}>
          <BrandMark
            size={54}
            color={theme.ink}
            accent={theme.accent}
            strokeWidth={1.35}
          />
        </Animated.View>
        <Animated.Text
          style={[styles.wordmark, { color: theme.ink }, entranceStyle]}
        >
          Mira
        </Animated.Text>
        <Animated.Text
          style={[styles.tagline, { color: theme.faint }, entranceStyle]}
        >
          A QUIETER BROWSER
        </Animated.Text>
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 24) + 30 },
        ]}
      >
        <Animated.View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.line, opacity: detail },
          ]}
        >
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.accent,
                transform: [{ translateX: barTranslate }],
              },
            ]}
          />
        </Animated.View>
        <Animated.Text
          style={[styles.status, { color: theme.faint, opacity: detail }]}
        >
          SETTLING IN
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  center: {
    alignItems: 'center',
    marginTop: -46,
  },
  wordmark: {
    marginTop: 18,
    fontFamily: fonts.serif,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -0.8,
  },
  tagline: {
    marginTop: 10,
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 2.6,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  progressTrack: {
    width: 72,
    height: 1,
    overflow: 'hidden',
  },
  progressBar: {
    width: 34,
    height: 1,
  },
  status: {
    marginTop: 14,
    fontFamily: fonts.medium,
    fontSize: 8.5,
    letterSpacing: 2.2,
  },
});
