import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * Creates a stable Animated.Value. React Native ships `useAnimatedValue`, but
 * react-native-web does not, so this shared hook keeps animation values
 * consistent across native and web.
 */
export function useAnimatedValue(initialValue: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initialValue));
  return value;
}
