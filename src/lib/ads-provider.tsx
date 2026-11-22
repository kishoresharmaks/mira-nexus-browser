import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import {
  adsAvailable,
  loadAdsModule,
  requestTrackingPermission,
  resolveBannerUnit,
  resolveRewardedUnit,
  type AdsModule,
} from '@/lib/ads';
import { useCatalogConfig } from '@/lib/catalog-provider';
import type { AdsConfig } from '@/lib/catalog';

type AdsPhase = 'off' | 'preparing' | 'ready' | 'blocked' | 'unavailable';

type AdsContextValue = {
  ads: AdsConfig;
  module: AdsModule | null;
  phase: AdsPhase;
  /** Overall SDK initialized and ready */
  sdkReady: boolean;
  /** Consent settled, SDK ready, banner enabled, and valid unit configured. */
  ready: boolean;
  bannerReady: boolean;
  rewardedReady: boolean;
  /** Development builds always force Google test units. */
  testMode: boolean;
  unitId: string | null;
  rewardedUnitId: string | null;
  showRewardedAd: (onComplete?: () => void) => Promise<boolean>;
  privacyOptionsRequired: boolean;
  showPrivacyOptions: () => Promise<boolean>;
};

const AdsContext = createContext<AdsContextValue | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const { ads } = useCatalogConfig();
  const bannerActive = (ads.bannerEnabled ?? ads.enabled) === true;
  const rewardedActive = ads.rewardedEnabled === true;
  const anyAdsEnabled = bannerActive || rewardedActive;

  const [module, setModule] = useState<AdsModule | null>(null);
  const [phase, setPhase] = useState<AdsPhase>(
    anyAdsEnabled ? 'preparing' : 'off',
  );
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const [rewardedLoaded, setRewardedLoaded] = useState(false);

  const rewardedAdRef = useRef<any>(null);
  const loadRewardedAdRef = useRef<() => void>(() => {});
  const rewardedCallbacksRef = useRef<{
    onComplete?: () => void;
    timer?: ReturnType<typeof setTimeout>;
  }>({});

  useEffect(() => {
    let alive = true;
    setPrivacyOptionsRequired(false);
    setModule(null);

    if (!anyAdsEnabled) {
      setPhase('off');
      return () => {
        alive = false;
      };
    }

    if (!adsAvailable()) {
      setPhase('unavailable');
      return () => {
        alive = false;
      };
    }

    setPhase('preparing');

    (async () => {
      const loaded = await loadAdsModule();
      if (!alive) return;
      if (!loaded) {
        setPhase('unavailable');
        return;
      }
      setModule(loaded);

      try {
        try {
          // UMP must run before initialize: the SDK may preload inventory on
          // startup. On iOS, ATT comes after the UMP form.
          const consent = await loaded.AdsConsent.gatherConsent();
          if (!alive) return;
          setPrivacyOptionsRequired(
            consent.privacyOptionsRequirementStatus ===
              loaded.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
          );

          if (Platform.OS === 'ios') {
            await requestTrackingPermission();
            if (!alive) return;
          }

          if (!consent.canRequestAds) {
            setPhase('blocked');
            return;
          }
        } catch {
          // If UMP consent gathering fails (e.g. no form configured in AdMob console),
          // continue to initialize so ads can still load.
        }

        await loaded.default().setRequestConfiguration({
          maxAdContentRating: loaded.MaxAdContentRating.T,
        });
        await loaded.default().initialize();
        if (alive) setPhase('ready');
      } catch {
        if (alive) setPhase('blocked');
      }
    })().catch(() => {
      if (alive) setPhase('unavailable');
    });

    return () => {
      alive = false;
    };
  }, [anyAdsEnabled]);

  const showPrivacyOptions = useCallback(async (): Promise<boolean> => {
    if (!module) return false;
    try {
      const consent = await module.AdsConsent.showPrivacyOptionsForm();
      setPrivacyOptionsRequired(
        consent.privacyOptionsRequirementStatus ===
          module.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      );
      if (!consent.canRequestAds) {
        setPhase('blocked');
        return true;
      }
      if (phase !== 'ready') {
        await module.default().setRequestConfiguration({
          maxAdContentRating: module.MaxAdContentRating.T,
        });
        await module.default().initialize();
        setPhase('ready');
      }
      return true;
    } catch {
      return false;
    }
  }, [module, phase]);

  const banner = useMemo(() => {
    if (!module) {
      return { unitId: null, testMode: __DEV__ || ads.testMode };
    }
    return resolveBannerUnit(module, ads);
  }, [ads, module]);

  const rewarded = useMemo(() => {
    if (!module) {
      return { unitId: null, testMode: __DEV__ || ads.testMode };
    }
    return resolveRewardedUnit(module, ads);
  }, [ads, module]);

  const loadRewardedAd = useCallback(() => {
    if (!module || !rewarded.unitId || !ads.rewardedEnabled) {
      setRewardedLoaded(false);
      return;
    }

    try {
      if (rewardedAdRef.current) {
        try {
          rewardedAdRef.current.removeAllListeners();
        } catch {}
        rewardedAdRef.current = null;
      }

      const ad = module.RewardedInterstitialAd.createForAdRequest(
        rewarded.unitId,
        {
          requestNonPersonalizedAdsOnly: false,
        },
      );

      ad.addAdEventListener(module.RewardedAdEventType.LOADED, () => {
        setRewardedLoaded(true);
      });

      ad.addAdEventListener(module.AdEventType.CLOSED, () => {
        setRewardedLoaded(false);
        const cb = rewardedCallbacksRef.current.onComplete;
        if (cb) {
          rewardedCallbacksRef.current.onComplete = undefined;
          if (rewardedCallbacksRef.current.timer) {
            clearTimeout(rewardedCallbacksRef.current.timer);
            rewardedCallbacksRef.current.timer = undefined;
          }
          cb();
        }
        loadRewardedAdRef.current();
      });

      ad.addAdEventListener(module.RewardedAdEventType.EARNED_REWARD, () => {
        // User earned reward
      });

      ad.addAdEventListener(module.AdEventType.ERROR, () => {
        setRewardedLoaded(false);
        const cb = rewardedCallbacksRef.current.onComplete;
        if (cb) {
          rewardedCallbacksRef.current.onComplete = undefined;
          if (rewardedCallbacksRef.current.timer) {
            clearTimeout(rewardedCallbacksRef.current.timer);
            rewardedCallbacksRef.current.timer = undefined;
          }
          cb();
        }
      });

      rewardedAdRef.current = ad;
      ad.load();
    } catch {
      setRewardedLoaded(false);
    }
  }, [ads.rewardedEnabled, module, rewarded.unitId]);

  useEffect(() => {
    loadRewardedAdRef.current = loadRewardedAd;
  }, [loadRewardedAd]);

  useEffect(() => {
    if (phase === 'ready' && ads.rewardedEnabled && rewarded.unitId) {
      loadRewardedAd();
    } else {
      setRewardedLoaded(false);
      if (rewardedAdRef.current) {
        try {
          rewardedAdRef.current.removeAllListeners();
        } catch {}
        rewardedAdRef.current = null;
      }
    }
  }, [ads.rewardedEnabled, loadRewardedAd, phase, rewarded.unitId]);

  useEffect(() => {
    return () => {
      if (rewardedCallbacksRef.current.timer) {
        clearTimeout(rewardedCallbacksRef.current.timer);
      }
      if (rewardedAdRef.current) {
        try {
          rewardedAdRef.current.removeAllListeners();
        } catch {}
      }
    };
  }, []);

  const showRewardedAd = useCallback(
    async (onComplete?: () => void): Promise<boolean> => {
      if (!ads.rewardedEnabled || !rewardedLoaded || !rewardedAdRef.current) {
        onComplete?.();
        if (ads.rewardedEnabled && phase === 'ready' && rewarded.unitId) {
          loadRewardedAd();
        }
        return false;
      }

      try {
        const timer = setTimeout(() => {
          const cb = rewardedCallbacksRef.current.onComplete;
          if (cb) {
            rewardedCallbacksRef.current.onComplete = undefined;
            cb();
          }
        }, 15000);

        rewardedCallbacksRef.current = {
          onComplete,
          timer,
        };

        await rewardedAdRef.current.show();
        return true;
      } catch {
        if (rewardedCallbacksRef.current.timer) {
          clearTimeout(rewardedCallbacksRef.current.timer);
          rewardedCallbacksRef.current.timer = undefined;
        }
        const cb = rewardedCallbacksRef.current.onComplete;
        rewardedCallbacksRef.current.onComplete = undefined;
        cb?.();
        loadRewardedAd();
        return false;
      }
    },
    [ads.rewardedEnabled, loadRewardedAd, phase, rewarded.unitId, rewardedLoaded],
  );

  const bannerReady =
    phase === 'ready' && Boolean(banner.unitId) && bannerActive;
  const rewardedReady =
    phase === 'ready' &&
    Boolean(rewarded.unitId) &&
    rewardedActive &&
    rewardedLoaded;

  const value = useMemo<AdsContextValue>(
    () => ({
      ads,
      module,
      phase,
      sdkReady: phase === 'ready',
      ready: bannerReady,
      bannerReady,
      rewardedReady,
      testMode: banner.testMode || rewarded.testMode,
      unitId: banner.unitId,
      rewardedUnitId: rewarded.unitId,
      showRewardedAd,
      privacyOptionsRequired:
        anyAdsEnabled && Boolean(module) && privacyOptionsRequired,
      showPrivacyOptions,
    }),
    [
      ads,
      anyAdsEnabled,
      banner.testMode,
      banner.unitId,
      bannerReady,
      module,
      phase,
      privacyOptionsRequired,
      rewarded.testMode,
      rewarded.unitId,
      rewardedReady,
      showPrivacyOptions,
      showRewardedAd,
    ],
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsContextValue {
  const value = useContext(AdsContext);
  if (!value) {
    throw new Error('useAds must be used inside AdsProvider');
  }
  return value;
}
