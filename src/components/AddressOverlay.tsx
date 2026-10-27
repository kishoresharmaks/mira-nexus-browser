import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { relativeTime } from '@/lib/time';
import { resolveInput } from '@/lib/url';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts, layout, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { HistoryEntry, Shortcut } from '@/types';
import { Favicon } from './Favicon';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { ScreenBackdrop } from './ScreenBackdrop';

type Suggestion = {
  id: string;
  title: string;
  url: string;
  host: string;
  meta: string;
};

/**
 * React Native Web adds the browser's own focus ring inside the capsule. The
 * capsule is the focus treatment, so hide the inner ring on web only.
 */
const focusRingReset =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none' } as unknown as TextStyle)
    : undefined;

type Props = {
  visible: boolean;
  initialValue: string;
  history: HistoryEntry[];
  shortcuts: Shortcut[];
  /** Private mode hides stored history and speaks in the private palette. */
  privateTab?: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
};

export function AddressOverlay({
  visible,
  initialValue,
  history,
  shortcuts,
  privateTab = false,
  onClose,
  onSubmit,
}: Props) {
  const { theme, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [query, setQuery] = useState(initialValue);
  const animation = useAnimatedValue(0);
  const inputRef = useRef<TextInputInstance>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setQuery(initialValue);
      // Intentionally keyed on visibility: the seed is captured when opening so
      // page loads underneath cannot overwrite what the person is typing.
      animation.setValue(0);
      Animated.timing(animation, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      focusTimer.current = setTimeout(() => inputRef.current?.focus(), 210);
      return () => {
        if (focusTimer.current) clearTimeout(focusTimer.current);
      };
    }

    Keyboard.dismiss();
    Animated.timing(animation, {
      toValue: 0,
      duration: 170,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  const trimmed = query.trim();
  const direct = trimmed ? resolveInput(trimmed) : null;
  const search = trimmed.toLowerCase();

  const shortcutMatches: Suggestion[] = trimmed
    ? shortcuts
        .filter((shortcut) => matches(search, shortcut.title, shortcut.host, shortcut.url))
        .map((shortcut) => ({
          id: `shortcut-${shortcut.id}`,
          title: shortcut.title,
          url: shortcut.url,
          host: shortcut.host,
          meta: 'Shortcut',
        }))
    : [];

  const historyMatches: Suggestion[] = (
    privateTab ? [] : trimmed ? history : history.slice(0, 5)
  )
    .filter(
      (entry) =>
        !trimmed || matches(search, entry.title, entry.host, entry.url),
    )
    .map((entry) => ({
      id: `history-${entry.id}`,
      title: entry.title,
      url: entry.url,
      host: entry.host,
      meta: relativeTime(entry.visitedAt),
    }));

  const directUrl = direct?.url;
  const shortcutSuggestions = shortcutMatches
    .filter((item) => item.url !== directUrl)
    .slice(0, 3);
  const shortcutUrls = new Set(shortcutSuggestions.map((item) => item.url));
  const historySuggestions = historyMatches
    .filter((item) => item.url !== directUrl && !shortcutUrls.has(item.url))
    .slice(0, 4);
  const hasMatches = shortcutSuggestions.length > 0 || historySuggestions.length > 0;

  const submit = (value: string) => {
    const next = value.trim();
    if (!next) return;
    haptic.tap();
    Keyboard.dismiss();
    onSubmit(next);
  };

  return (
    <Animated.View
      style={[styles.root, { opacity: animation }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]} />
      <ScreenBackdrop />
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.topRow}>
          <IconButton
            icon="close"
            label="Close address bar"
            variant="surface"
            size={40}
            iconSize={18}
            onPress={onClose}
          />
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: theme.surface, borderColor: theme.line },
              softShadow(theme.mode, 'dock'),
            ]}
          >
            <Icon
              name={privateTab ? 'mask' : 'search'}
              size={18}
              color={privateTab ? theme.accent : theme.muted}
              strokeWidth={1.9}
            />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => submit(query)}
              placeholder={
                privateTab
                  ? 'Search or enter a link'
                  : 'Search or enter a website'
              }
              placeholderTextColor={theme.faint}
              style={[styles.input, focusRingReset, { color: theme.ink }]}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              selectTextOnFocus
              returnKeyType="go"
              keyboardAppearance={mode}
              selectionColor={theme.accent}
              accessibilityLabel={
                privateTab
                  ? 'Private address and search field'
                  : 'Address and search field'
              }
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                hitSlop={10}
                accessibilityLabel="Clear address"
                accessibilityRole="button"
              >
                <Icon name="close" size={15} color={theme.muted} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => submit(query)}
            disabled={!trimmed}
            style={[
              styles.goButton,
              { backgroundColor: trimmed ? theme.accent : theme.chip },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go"
          >
            <Icon
              name="arrowRight"
              size={19}
              color={trimmed ? theme.accentInk : theme.faint}
              strokeWidth={2.1}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 30 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {trimmed && direct ? (
            <Pressable
              onPress={() => submit(direct.url)}
              style={({ pressed }) => [
                styles.primary,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                },
                softShadow(theme.mode),
                pressed ? { opacity: 0.72 } : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                direct.kind === 'url'
                  ? `Go to ${direct.host}`
                  : `Search for ${trimmed}`
              }
            >
              <View
                style={[
                  styles.primaryIcon,
                  {
                    backgroundColor:
                      privateTab || direct.kind === 'url'
                        ? theme.accentSoft
                        : theme.chip,
                  },
                ]}
              >
                <Icon
                  name={
                    privateTab
                      ? 'mask'
                      : direct.kind === 'url'
                        ? 'globe'
                        : 'search'
                  }
                  size={19}
                  color={
                    privateTab || direct.kind === 'url'
                      ? theme.accent
                      : theme.inkSoft
                  }
                />
              </View>
              <View style={styles.primaryCopy}>
                <Text
                  numberOfLines={1}
                  style={[styles.primaryTitle, { color: theme.ink }]}
                >
                  {direct.kind === 'url' ? `Go to ${direct.host}` : `Search “${trimmed}”`}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.primaryMeta, { color: theme.muted }]}
                >
                  {direct.kind === 'url' ? direct.url : 'DuckDuckGo · Private search'}
                </Text>
              </View>
              <Icon
                name={direct.kind === 'url' ? 'arrowUpRight' : 'arrowRight'}
                size={16}
                color={theme.faint}
                strokeWidth={1.9}
              />
            </Pressable>
          ) : null}

          {shortcutSuggestions.length > 0 ? (
            <SuggestionGroup
              label="SHORTCUTS"
              items={shortcutSuggestions}
              onPress={(item) => submit(item.url)}
            />
          ) : null}

          {historySuggestions.length > 0 ? (
            <SuggestionGroup
              label={trimmed ? 'MATCHES' : 'RECENT'}
              items={historySuggestions}
              onPress={(item) => submit(item.url)}
            />
          ) : null}

          {!trimmed && !hasMatches ? (
            <View style={styles.empty}>
              <View style={[styles.emptyOrb, { backgroundColor: theme.accentSoft }]}>
                <Icon
                  name={privateTab ? 'mask' : 'globe'}
                  size={24}
                  color={theme.accent}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                {privateTab ? 'A private start' : 'Where to?'}
              </Text>
              <Text style={[styles.emptyBody, { color: theme.muted }]}>
                {privateTab
                  ? 'Type a link, a domain, or a question. Nothing here enters history.'
                  : 'Type a link, a domain, or a question. Mira takes you straight there.'}
              </Text>
            </View>
          ) : null}

          {!trimmed ? (
            <View style={styles.tipRow}>
              <Icon
                name={privateTab ? 'mask' : 'shield'}
                size={13}
                color={theme.faint}
                strokeWidth={1.7}
              />
              <Text style={[styles.tip, { color: theme.faint }]}>
                {privateTab
                  ? 'Private tab. History and trails stay untouched.'
                  : 'Searches go to DuckDuckGo. History stays on this device.'}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

function SuggestionGroup({
  label,
  items,
  onPress,
}: {
  label: string;
  items: Suggestion[];
  onPress: (item: Suggestion) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: theme.muted }]}>{label}</Text>
      <View
        style={[
          styles.groupCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
          },
          softShadow(theme.mode),
        ]}
      >
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => onPress(item)}
            style={({ pressed }) => [
              styles.row,
              index > 0
                ? {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.line,
                  }
                : null,
              pressed ? { opacity: 0.65 } : null,
            ]}
            accessibilityRole="link"
            accessibilityLabel={`${item.title}, ${item.host}`}
          >
            <Favicon host={item.host} title={item.title} size={34} />
            <View style={styles.rowCopy}>
              <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.ink }]}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={[styles.rowMeta, { color: theme.muted }]}>
                {item.meta === 'Shortcut' ? item.host : `${item.host} · ${item.meta}`}
              </Text>
            </View>
            <Icon
              name="arrowUpRight"
              size={14}
              color={theme.faint}
              strokeWidth={1.9}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function matches(query: string, ...values: string[]): boolean {
  return values.some((value) => value.toLowerCase().includes(query));
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 16,
  },
  inputWrap: {
    flex: 1,
    height: 50,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 9,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.sans,
    fontSize: 15.5,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  goButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  primary: {
    minHeight: 66,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCopy: {
    flex: 1,
    gap: 3,
  },
  primaryTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  primaryMeta: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  group: {
    marginTop: 24,
  },
  groupLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    letterSpacing: 1.65,
    marginBottom: 10,
  },
  groupCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  rowMeta: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  empty: {
    marginTop: 56,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  emptyOrb: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  emptyBody: {
    marginTop: 7,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 300,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    paddingHorizontal: 10,
  },
  tip: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    textAlign: 'center',
  },
});
