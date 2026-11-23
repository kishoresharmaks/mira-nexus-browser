import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAds } from '@/lib/ads-provider';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  layout: 'inline' | 'anchored';
  /** The home screen is actually on screen. Browsing unmounts the request. */
  visible: boolean;
  /** Measured height of the anchored slot, so Home can avoid an empty gap. */
  onHeightChange?: (height: number) => void;
};

/**
 * One banner, one place. The slot is absent unless the published catalog
 * enables ads, consent has settled, the SDK is ready, and the platform has a
 * usable unit. Failures collapse to nothing; the rest of the home screen never
 * waits for an ad.
 */
export function HomeAdSlot({ layout, visible, onHeightChange }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { ads, module, ready, unitId, testMode } = useAds();
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [useTestFallback, setUseTestFallback] = useState(false);
  const lastHeight = useRef(0);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setUseTestFallback(false);
  }, [unitId, testMode]);

  useEffect(() => {
    if (
      visible &&
      ready &&
      unitId &&
      !failed &&
      ads.layout === layout
    ) {
      return;
    }
    lastHeight.current = 0;
    onHeightChange?.(0);
  }, [ads.layout, failed, layout, onHeightChange, ready, unitId, visible]);

  if (!visible || !ready || !module || !unitId) return null;
  if (ads.layout !== layout) return null;
  if (failed) return null;

  const BannerAd = module.BannerAd;
  const size =
    layout === 'anchored'
      ? module.BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER
      : module.BannerAdSize.INLINE_ADAPTIVE_BANNER;
  const anchored = layout === 'anchored';
  const activeUnitId =
    useTestFallback && module.TestIds
      ? module.TestIds.ADAPTIVE_BANNER
      : unitId;

  return (
    <View
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        if (next > 0 && next !== width) setWidth(next);
        if (anchored) {
          const height = loaded ? Math.round(event.nativeEvent.layout.height) : 0;
          if (height !== lastHeight.current) {
            lastHeight.current = height;
            onHeightChange?.(height);
          }
        }
      }}
      style={[
        anchored ? styles.anchored : styles.inline,
        anchored
          ? {
              backgroundColor: theme.bgTop,
              borderTopColor: theme.line,
              paddingBottom: Math.max(insets.bottom, 8),
            }
          : null,
      ]}
      accessibilityLabel="Advertisement"
    >
      {loaded ? (
        <Text style={[styles.label, { color: theme.faint }]}>
          ADVERTISEMENT
        </Text>
      ) : null}
      <View
        style={[
          styles.banner,
          !loaded ? styles.pending : null,
          !anchored ? softShadow(theme.mode, 'dock') : null,
        ]}
      >
        {width > 0 ? (
          <BannerAd
            key={`${layout}-${activeUnitId}-${testMode || useTestFallback ? 'test' : 'live'}`}
            unitId={activeUnitId}
            size={size}
            width={width}
            onAdLoaded={() => setLoaded(true)}
            onAdFailedToLoad={(error) => {
              console.warn(`[HomeAdSlot] ${layout} ad failed to load:`, error);
              if (!useTestFallback && !testMode && module?.TestIds) {
                setUseTestFallback(true);
                return;
              }
              setFailed(true);
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    marginTop: 26,
    marginBottom: 2,
    alignItems: 'center',
  },
  anchored: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 1.4,
    marginBottom: 5,
    alignSelf: 'center',
  },
  banner: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 2,
    overflow: 'hidden',
  },
  pending: {
    minHeight: 50,
    opacity: 0,
    overflow: 'hidden',
  },
});
