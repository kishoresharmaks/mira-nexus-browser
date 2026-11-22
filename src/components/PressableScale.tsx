import { type ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAnimatedValue } from '@/lib/useAnimatedValue';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: ReactNode;
};

export function PressableScale({
  style,
  scaleTo = 0.95,
  children,
  disabled,
  ...rest
}: Props) {
  const scale = useAnimatedValue(1);

  const animate = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: Platform.OS !== 'web',
      speed: 40,
      bounciness: 3,
    }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      style={[
        style,
        { transform: [{ scale }] },
        disabled ? { opacity: 0.32 } : null,
      ]}
      accessible
      accessibilityRole="button"
    >
      {children}
    </AnimatedPressable>
  );
}
