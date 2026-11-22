import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cleanTitle, getDisplayUrl, hostOf, isWebUrl } from '@/lib/url';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { BrowserHandle, PageSnapshot } from '@/types';
import { BrandMark } from './BrandMark';
import { ScreenBackdrop } from './ScreenBackdrop';

type Props = {
  initialUrl: string;
  active?: boolean;
  /** Web previews cannot isolate cookies; they only mark the private room. */
  privateTab?: boolean;
  onSnapshot: (snapshot: PageSnapshot) => void;
  onVisit: (url: string, title: string) => void;
  onGoHome: () => void;
  onOpenWindow?: (url: string, title?: string) => void;
  onScrollChange?: (visible: boolean) => void;
};

/**
 * Web-only stand-in for the native WebView. It exists so the interface can be
 * explored in a desktop browser; many sites refuse to be framed, so the local
 * demo page is the best target for visual QA.
 */
export const BrowserPane = forwardRef<BrowserHandle, Props>(function BrowserPane(
  { initialUrl, active = true, privateTab = false, onSnapshot, onVisit },
  ref,
) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const curtain = useAnimatedValue(1);
  const aliveRef = useRef(true);

  const [url, setUrl] = useState(initialUrl);
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [curtainMounted, setCurtainMounted] = useState(true);
  const [snapshot, setSnapshot] = useState<PageSnapshot>({
    url: initialUrl,
    title: hostOf(initialUrl),
    canGoBack: false,
    canGoForward: false,
    loading: true,
  });

  const snapshotListener = useRef(onSnapshot);
  snapshotListener.current = onSnapshot;
  const visitListener = useRef(onVisit);
  visitListener.current = onVisit;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    snapshotListener.current(snapshot);
  }, [snapshot]);

  const hideCurtain = useCallback(() => {
    Animated.timing(curtain, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && aliveRef.current) setCurtainMounted(false);
    });
  }, [curtain]);

  const navigate = useCallback((next: string) => {
    if (!isWebUrl(next)) return;
    setUrl(next);
    setLoading(true);
    setSnapshot({
      url: next,
      title: hostOf(next),
      canGoBack: false,
      canGoForward: false,
      loading: true,
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      goBack: () => {
        try {
          frameRef.current?.contentWindow?.history.back();
        } catch {
          // Cross-origin frames do not expose their history.
        }
      },
      goForward: () => {
        try {
          frameRef.current?.contentWindow?.history.forward();
        } catch {
          // Cross-origin frames do not expose their history.
        }
      },
      reload: () => {
        setLoading(true);
        setNonce((value) => value + 1);
      },
      stop: () => {},
      load: navigate,
      setActive: () => {},
      extractArticle: () => {},
    }),
    [navigate],
  );

  const handleLoad = () => {
    let finalUrl = url;
    let title = hostOf(url);

    try {
      const frameWindow = frameRef.current?.contentWindow;
      const location = frameWindow?.location;
      if (location?.href && location.href !== 'about:blank') {
        finalUrl = location.href;
        title = frameWindow?.document.title || title;
      }
    } catch {
      // Cross-origin pages hide their location; keep the requested URL.
    }

    const clean = cleanTitle(title, finalUrl);
    setLoading(false);
    setSnapshot({
      url: finalUrl,
      title: clean,
      canGoBack: false,
      canGoForward: false,
      loading: false,
    });
    hideCurtain();
    if (!privateTab) visitListener.current(finalUrl, clean);
  };

  const display = getDisplayUrl(snapshot.url);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={{ height: insets.top, backgroundColor: theme.bg }} />
      <View style={styles.frame}>
        {createElement('iframe', {
          ref: frameRef,
          key: `${url}-${nonce}`,
          src: url,
          title: 'Nexus web preview',
          onLoad: handleLoad,
          allow: 'clipboard-write; fullscreen; autoplay',
          style: {
            border: 'none',
            width: '100%',
            height: '100%',
            backgroundColor: theme.bg,
            // The iframe is the one child of the hidden browser layer that
            // would otherwise keep taking taps meant for the home screen.
            pointerEvents: active ? 'auto' : 'none',
          },
        })}

        {curtainMounted ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.bg, opacity: curtain },
            ]}
          >
            <ScreenBackdrop />
            <View style={styles.curtainBody}>
              <View
                style={[
                  styles.curtainMark,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.line,
                  },
                  softShadow(theme.mode, 'dock'),
                ]}
              >
                <BrandMark
                  size={30}
                  color={theme.ink}
                  accent={theme.accent}
                  strokeWidth={1.6}
                />
              </View>
              <Text style={[styles.curtainHost, { color: theme.ink }]}>
                {display.host}
              </Text>
              <Text style={[styles.curtainLabel, { color: theme.muted }]}>
                {privateTab ? 'Private · opening quietly' : 'Opening quietly'}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <View
          pointerEvents="none"
          style={[
            styles.progress,
            {
              opacity: loading ? 1 : 0,
              backgroundColor: theme.accentSoft,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: loading ? '42%' : '100%',
                backgroundColor: theme.accent,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  frame: {
    flex: 1,
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  progressFill: {
    height: 2,
  },
  curtainBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 70,
    paddingHorizontal: 32,
  },
  curtainMark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  curtainHost: {
    fontFamily: fonts.medium,
    fontSize: 15,
    letterSpacing: 0.1,
    maxWidth: '86%',
  },
  curtainLabel: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    marginTop: 5,
    letterSpacing: 0.15,
  },
});
