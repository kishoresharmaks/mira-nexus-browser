import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import {
  adsAvailable,
  loadAdsModule,
  requestTrackingPermission,
  resolveBannerUnit,
  type AdsModule,
} from '@/lib/ads';
import { useCatalogConfig } from '@/lib/catalog-provider';
import type { AdsConfig } from '@/lib/catalog';

type AdsPhase = 'off' | 'preparing' | 'ready' | 'blocked' | 'unavailable';

type AdsContextValue = {
  ads: AdsConfig;
  module: AdsModule | null;
  phase: AdsPhase;
  /** Consent is settled and the SDK is initialized. */
  ready: boolean;
  /** Development builds always force Google test units. */
  testMode: boolean;
  unitId: string | null;
  privacyOptionsRequired: boolean;
  showPrivacyOptions: () => Promise<boolean>;
};

const AdsContext = createContext<AdsContextValue | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const { ads } = useCatalogConfig();
  const enabled = ads.enabled;
  const [module, setModule] = useState<AdsModule | null>(null);
  const [phase, setPhase] = useState<AdsPhase>(enabled ? 'preparing' : 'off');
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);

  useEffect(() => {
    let alive = true;
    setPrivacyOptionsRequired(false);
    setModule(null);

    if (!enabled) {
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
  }, [enabled]);

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

  const value = useMemo<AdsContextValue>(
    () => ({
      ads,
      module,
      phase,
      ready:
        phase === 'ready' && Boolean(banner.unitId) && ads.enabled,
      testMode: banner.testMode,
      unitId: banner.unitId,
      privacyOptionsRequired:
        ads.enabled && Boolean(module) && privacyOptionsRequired,
      showPrivacyOptions,
    }),
    [
      ads,
      banner.testMode,
      banner.unitId,
      module,
      phase,
      privacyOptionsRequired,
      showPrivacyOptions,
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
