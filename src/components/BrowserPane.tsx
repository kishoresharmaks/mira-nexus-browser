import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentType,
  type Ref,
} from 'react';
import {
  Animated,
  Easing,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation, WebViewProps } from 'react-native-webview';
import { haptic } from '@/lib/haptics';
import {
  cleanTitle,
  getDisplayUrl,
  hostOf,
  isWebUrl,
  toSecureHttps,
} from '@/lib/url';
import { useAnimatedValue } from '@/lib/useAnimatedValue';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { BrowserHandle, PageSnapshot } from '@/types';
import { BrandMark } from './BrandMark';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { ScreenBackdrop } from './ScreenBackdrop';

type Props = {
  initialUrl: string;
  /** The tab is on screen. Inactive WebViews are kept warm but must be quiet. */
  active?: boolean;
  /**
   * A private tab writes no history or trails, bypasses WebView's page cache,
   * and is never reported to the community lookup. On iOS it also gets a
   * non-persistent WKWebsiteDataStore. Android has one app-wide cookie and
   * DOM-storage store, so private tabs share it with normal tabs. The
   * `incognito` prop must not be used there: it clears every cookie in the app
   * and would sign normal tabs out.
   */
  privateTab?: boolean;
  onSnapshot: (snapshot: PageSnapshot) => void;
  onVisit: (url: string, title: string) => void;
  onGoHome: () => void;
  /** A page asked for a new window. The shell decides whether to make a tab. */
  onOpenWindow?: (url: string, title?: string) => void;
};

type LoadError = {
  url: string;
  description: string;
};

/**
 * react-native-webview 14 declares its component with `P = undefined`, which
 * collapses `WebViewProps & P` to `never` under TypeScript 6. Re-type the
 * component here so props and the imperative handle stay checked.
 */
const NativeWebView = WebView as unknown as ComponentType<
  WebViewProps & { ref?: Ref<WebView> }
>;

type ShouldStartLoadRequest = Parameters<
  NonNullable<WebViewProps['onShouldStartLoadWithRequest']>
>[0];

const START_PROGRESS = 0.07;

/**
 * Schemes that may leave the WebView. `intent:`, `market:` and arbitrary
 * deep links are deliberately absent: a page must never be able to launch an
 * unvetted Android activity. Everything else stays inside the sandbox.
 */
const EXTERNAL_SCHEME = /^(?:mailto|tel|sms|geo):/i;

const PAUSE_MEDIA = `
  (function () {
    try {
      var media = document.querySelectorAll('video, audio');
      for (var i = 0; i < media.length; i += 1) {
        try { media[i].pause(); } catch (error) {}
      }
    } catch (error) {}
    return true;
  })();
  true;
`;

export const BrowserPane = forwardRef<BrowserHandle, Props>(function BrowserPane(
  {
    initialUrl,
    active = true,
    privateTab = false,
    onSnapshot,
    onVisit,
    onGoHome,
    onOpenWindow,
  },
  ref,
) {
  const { theme, mode } = useTheme();
  const insets = useSafeAreaInsets();

  const webRef = useRef<WebView>(null);
  const aliveRef = useRef(true);
  const startedRef = useRef(false);
  const recordedRef = useRef(false);
  const curtainDoneRef = useRef(false);
  const errorRef = useRef<LoadError | null>(null);
  const urlRef = useRef(initialUrl);
  const titleRef = useRef(hostOf(initialUrl));

  const [sourceUrl, setSourceUrl] = useState(initialUrl);
  const [webKey, setWebKey] = useState(0);
  const [progress, setProgress] = useState(START_PROGRESS);
  const [error, setError] = useState<LoadError | null>(null);
  const [curtainMounted, setCurtainMounted] = useState(true);
  const [snapshot, setSnapshot] = useState<PageSnapshot>({
    url: initialUrl,
    title: hostOf(initialUrl),
    canGoBack: false,
    canGoForward: false,
    loading: true,
  });

  const curtain = useAnimatedValue(1);

  const snapshotListener = useRef(onSnapshot);
  snapshotListener.current = onSnapshot;
  const visitListener = useRef(onVisit);
  visitListener.current = onVisit;
  const windowListener = useRef(onOpenWindow);
  windowListener.current = onOpenWindow;

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
    if (curtainDoneRef.current) return;
    curtainDoneRef.current = true;
    Animated.timing(curtain, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && aliveRef.current) setCurtainMounted(false);
    });
  }, [curtain]);

  const pauseMedia = useCallback(() => {
    webRef.current?.injectJavaScript(PAUSE_MEDIA);
  }, []);

  useEffect(() => {
    if (!active) pauseMedia();
  }, [active, pauseMedia]);

  const recordVisit = useCallback(
    (url: string, title: string) => {
      if (privateTab || recordedRef.current || errorRef.current) return;
      if (!isWebUrl(url)) return;
      recordedRef.current = true;
      visitListener.current(url, cleanTitle(title, url));
    },
    [privateTab],
  );

  const navigate = useCallback((url: string) => {
    if (!isWebUrl(url)) return;

    errorRef.current = null;
    setError(null);
    setProgress(START_PROGRESS);
    urlRef.current = url;
    titleRef.current = hostOf(url);
    setSnapshot((previous) => ({
      ...previous,
      url,
      title: hostOf(url),
      loading: true,
    }));

    // The very first navigation can land before the native view has committed
    // its source, so switch the source itself rather than injecting into a
    // document that is still being created.
    if (!startedRef.current) {
      setSourceUrl(url);
      return;
    }

    webRef.current?.injectJavaScript(
      `window.location.assign(${JSON.stringify(url)}); true;`,
    );
  }, []);

  /**
   * The Android renderer can be killed under memory pressure. A fresh WebView
   * key is the only reliable way back; never leave the user on a blank frame.
   */
  const recover = useCallback(() => {
    const url = isWebUrl(urlRef.current) ? urlRef.current : initialUrl;
    errorRef.current = null;
    startedRef.current = false;
    recordedRef.current = false;
    curtainDoneRef.current = false;
    urlRef.current = url;
    titleRef.current = hostOf(url);

    setError(null);
    setProgress(START_PROGRESS);
    setSourceUrl(url);
    setSnapshot({
      url,
      title: hostOf(url),
      canGoBack: false,
      canGoForward: false,
      loading: true,
    });
    curtain.setValue(1);
    setCurtainMounted(true);
    setWebKey((value) => value + 1);
  }, [curtain, initialUrl]);

  useImperativeHandle(
    ref,
    () => ({
      goBack: () => webRef.current?.goBack(),
      goForward: () => webRef.current?.goForward(),
      reload: () => {
        errorRef.current = null;
        setError(null);
        setProgress(START_PROGRESS);
        webRef.current?.reload();
      },
      stop: () => webRef.current?.stopLoading(),
      load: navigate,
      setActive: (next: boolean) => {
        if (!next) pauseMedia();
      },
    }),
    [navigate, pauseMedia],
  );

  const finishLoad = useCallback(() => {
    setProgress(1);
    hideCurtain();
  }, [hideCurtain]);

  const handleLoadStart = (url: string) => {
    startedRef.current = true;
    recordedRef.current = false;
    errorRef.current = null;
    setError(null);
    setProgress(START_PROGRESS);

    const nextUrl = isWebUrl(url) ? url : urlRef.current;
    if (isWebUrl(nextUrl)) {
      urlRef.current = nextUrl;
      const nextTitle = hostOf(nextUrl);
      titleRef.current = nextTitle;
      setSnapshot((previous) => ({
        ...previous,
        url: nextUrl,
        title: nextTitle,
        loading: true,
      }));
    } else {
      setSnapshot((previous) => ({ ...previous, loading: true }));
    }
  };

  const handleNavigation = (navigation: WebViewNavigation) => {
    const resolvedUrl =
      navigation.url && navigation.url !== 'about:blank'
        ? navigation.url
        : urlRef.current;
    const nextTitle = cleanTitle(navigation.title, resolvedUrl);

    if (isWebUrl(resolvedUrl)) {
      urlRef.current = resolvedUrl;
      titleRef.current = nextTitle;
    }

    setSnapshot({
      url: resolvedUrl,
      title: nextTitle,
      canGoBack: navigation.canGoBack,
      canGoForward: navigation.canGoForward,
      loading: navigation.loading,
    });

    if (!navigation.loading) {
      finishLoad();
      recordVisit(resolvedUrl, nextTitle);
    }
  };

  const handleLoadEnd = () => {
    setSnapshot((previous) => ({ ...previous, loading: false }));
    finishLoad();
    recordVisit(urlRef.current, titleRef.current);
  };

  const handleError = (error: LoadError) => {
    errorRef.current = error;
    setError(error);
    setProgress(1);
    setSnapshot((previous) => ({
      ...previous,
      loading: false,
      url: isWebUrl(error.url) ? error.url : previous.url,
    }));
    hideCurtain();
  };

  const openScheme = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  /**
   * Only web pages may become the top-level document. HTTP is upgraded to
   * HTTPS; frames may still use data/blob/about, but a top-level data: page
   * (a classic URL-spoofing trick) is refused. External schemes are limited to
   * the four the OS can always hand off safely.
   */
  const handleRequest = (request: ShouldStartLoadRequest): boolean => {
    const url = request.url;
    if (!url) return false;

    if (/^https:/i.test(url)) return true;

    if (/^http:/i.test(url)) {
      if (!request.isTopFrame) return true;
      const secure = toSecureHttps(url);
      if (secure) {
        navigate(secure);
        return false;
      }
      return false;
    }

    if (/^about:blank$/i.test(url)) return true;

    if (!request.isTopFrame && /^(about|data|blob):/i.test(url)) {
      return true;
    }

    if (EXTERNAL_SCHEME.test(url)) {
      if (request.isTopFrame) openScheme(url);
      return false;
    }

    return false;
  };

  const host = getDisplayUrl(snapshot.url).host;
  const errorHost = error ? getDisplayUrl(error.url).host : '';

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={{ height: insets.top, backgroundColor: theme.bg }} />

      <View style={styles.frame}>
        <NativeWebView
          key={webKey}
          ref={webRef}
          source={{ uri: sourceUrl }}
          style={[styles.web, { backgroundColor: theme.bg }]}
          originWhitelist={[
            'http://*',
            'https://*',
            'about:*',
            'data:*',
            'blob:*',
          ]}
          javaScriptEnabled
          domStorageEnabled
          // iOS incognito uses a non-persistent store. Android's incognito
          // implementation calls CookieManager.removeAllCookies globally, so
          // using it there would wipe every normal-tab session.
          incognito={Platform.OS === 'ios' ? privateTab : undefined}
          sharedCookiesEnabled={!privateTab}
          // Cross-site cookies are the plumbing of third-party tracking. Sites
          // keep working with first-party cookies; a page cannot follow the
          // reader from one host to another.
          thirdPartyCookiesEnabled={false}
          cacheEnabled={!privateTab}
          // The WebView is a browser, not an app runtime: it has no business
          // reading local files, saving form data, or reaching a file:// page.
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          saveFormDataDisabled
          mixedContentMode="never"
          geolocationEnabled={false}
          mediaCapturePermissionGrantType="deny"
          javaScriptCanOpenWindowsAutomatically={false}
          mediaPlaybackRequiresUserAction
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          allowsBackForwardNavigationGestures
          allowsLinkPreview={false}
          // Android needs multiple-window support so target=_blank reaches
          // onOpenWindow, where the shell can make a real tab. iOS uses the
          // same callback for window.open.
          setSupportMultipleWindows={Platform.OS === 'android'}
          setBuiltInZoomControls
          setDisplayZoomControls={false}
          textZoom={100}
          overScrollMode="never"
          bounces
          // react-native-webview's Android native spec types this as a Double,
          // so the iOS string shortcut crashes Android during view creation.
          {...(Platform.OS === 'ios' ? { decelerationRate: 'normal' as const } : null)}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          pullToRefreshEnabled={Platform.OS === 'ios'}
          refreshControlLightMode={mode === 'light'}
          applicationNameForUserAgent="Nexus/1.0"
          webviewDebuggingEnabled={__DEV__}
          onLoadStart={(event) => handleLoadStart(event.nativeEvent.url)}
          onLoadProgress={(event) =>
            setProgress(Math.min(1, Math.max(0.04, event.nativeEvent.progress)))
          }
          onNavigationStateChange={handleNavigation}
          onLoadEnd={handleLoadEnd}
          onError={(event) => {
            const { url, description, code } = event.nativeEvent;
            if (code === -999) return;
            const failedUrl = isWebUrl(url) ? url : urlRef.current;
            if (!isWebUrl(failedUrl)) return;
            handleError({
              url: failedUrl,
              description: description || 'The page could not be loaded.',
            });
          }}
          onShouldStartLoadWithRequest={handleRequest}
          onOpenWindow={(event) => {
            const target = event.nativeEvent.targetUrl;
            if (!target) return;
            if (isWebUrl(target)) {
              const listener = windowListener.current;
              if (listener) listener(target);
              else navigate(target);
              return;
            }
            if (EXTERNAL_SCHEME.test(target)) openScheme(target);
          }}
          onContentProcessDidTerminate={recover}
          onRenderProcessGone={recover}
        />

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
                {host}
              </Text>
              <Text style={[styles.curtainLabel, { color: theme.muted }]}>
                Opening quietly
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {error ? (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}
          >
            <ScreenBackdrop />
            <View style={styles.errorBody}>
              <View
                style={[
                  styles.errorOrb,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Icon name="wifiOff" size={26} color={theme.accent} />
              </View>
              <Text style={[styles.errorTitle, { color: theme.ink }]}>
                This page went quiet
              </Text>
              <Text style={[styles.errorCopy, { color: theme.muted }]}>
                Nexus couldn&apos;t reach{' '}
                <Text style={{ color: theme.inkSoft }}>{errorHost}</Text>. Nexus
                only opens secure HTTPS pages, so check the address or your
                connection, then try again.
              </Text>
              <PressableScale
                onPress={() => {
                  haptic.tap();
                  errorRef.current = null;
                  setError(null);
                  setProgress(START_PROGRESS);
                  webRef.current?.reload();
                }}
                style={[
                  styles.retry,
                  { backgroundColor: theme.accent },
                  softShadow(theme.mode, 'dock'),
                ]}
                accessibilityLabel="Try loading the page again"
              >
                <Icon
                  name="refresh"
                  size={16}
                  color={theme.accentInk}
                  strokeWidth={2.1}
                />
                <Text style={[styles.retryText, { color: theme.accentInk }]}>
                  Try again
                </Text>
              </PressableScale>
              <PressableScale
                onPress={onGoHome}
                scaleTo={0.98}
                style={styles.homeLink}
                accessibilityLabel="Return to the Nexus home screen"
              >
                <Text style={[styles.homeLinkText, { color: theme.muted }]}>
                  Back to Nexus
                </Text>
              </PressableScale>
            </View>
          </View>
        ) : null}

        <View
          pointerEvents="none"
          style={[
            styles.progress,
            {
              opacity: snapshot.loading && !error ? 1 : 0,
              backgroundColor: theme.accentSoft,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress * 100)}%` as `${number}%`,
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
  web: {
    flex: 1,
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
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
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
  errorBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 86,
  },
  errorOrb: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  errorTitle: {
    fontFamily: fonts.serif,
    fontSize: 32,
    letterSpacing: -0.55,
    textAlign: 'center',
    includeFontPadding: false,
  },
  errorCopy: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  retry: {
    marginTop: 26,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 146,
  },
  retryText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  homeLink: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  homeLinkText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
});
