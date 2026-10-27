import { useEffect, useRef } from 'react';

/**
 * A ref that always holds the most recently committed value. Event handlers,
 * timers, and native callbacks can read `ref.current` without being rebuilt on
 * every render, and the value is never written during render.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
