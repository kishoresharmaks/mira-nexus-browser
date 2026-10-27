import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * JSON-backed state that survives restarts. Values are written lazily so the
 * stored copy is never replaced by the initial value before hydration.
 *
 * `normalize` is the boundary between untrusted storage and the UI. A previous
 * version, a partial write, or a manual edit must never be able to crash a
 * screen or inject a non-web URL into the browser.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  normalize?: (value: unknown) => T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const shouldPersist = useRef(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!alive) return;
        if (raw != null) {
          try {
            const parsed: unknown = JSON.parse(raw);
            setValue(normalize ? normalize(parsed) : (parsed as T));
          } catch {
            // Ignore corrupt data and keep the default.
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!alive) return;
        shouldPersist.current = true;
        setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, [key, normalize]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (current: T) => T)(prev) : next;
        if (shouldPersist.current) {
          AsyncStorage.setItem(key, JSON.stringify(resolved)).catch(() => {});
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated];
}
