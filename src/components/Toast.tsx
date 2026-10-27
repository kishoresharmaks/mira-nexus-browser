import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './Icon';
import type { ToastAction } from '@/types';

type ToastData = {
  id: number;
  message: string;
  action?: ToastAction;
};

type ToastContextValue = {
  show: (message: string, action?: ToastAction) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const show = useCallback((message: string, action?: ToastAction) => {
    clearTimer();
    setData({ id: Date.now(), message, action });
    timer.current = setTimeout(() => setData(null), action ? 3600 : 2400);
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setData(null);
  }, []);

  useEffect(() => clearTimer, []);

  return (
    <ToastContext.Provider value={{ show }}>
      <View style={styles.root}>
        {children}
        <ToastView data={data} onHide={hide} />
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ data, onHide }: { data: ToastData | null; onHide: () => void }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState<ToastData | null>(null);
  const animation = useAnimatedValue(0);

  useEffect(() => {
    if (data) {
      setVisible(data);
      animation.setValue(0);
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        speed: 28,
        bounciness: 5,
      }).start();
      return;
    }

    if (visible) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setVisible(null);
      });
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          bottom: insets.bottom + 88,
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: theme.inverse,
            borderColor: theme.line,
          },
          softShadow(theme.mode, 'dock'),
        ]}
        accessibilityLiveRegion="polite"
      >
        <View style={[styles.check, { backgroundColor: theme.accent }]}>
          <Icon name="check" size={12} color={theme.accentInk} strokeWidth={2.3} />
        </View>
        <Text
          style={[styles.message, { color: theme.inverseInk }]}
          numberOfLines={2}
        >
          {visible.message}
        </Text>
        {visible.action ? (
          <Pressable
            onPress={() => {
              visible.action?.onPress();
              onHide();
            }}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={[styles.action, { color: theme.accent }]}>
              {visible.action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    maxWidth: 460,
    minHeight: 46,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 18,
  },
  action: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    paddingHorizontal: 2,
  },
});
