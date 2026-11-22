'use client';

import { isAdUnitId, type AdsConfig, type AdsLayout } from '@/lib/catalog';

type Props = {
  ads: AdsConfig;
  busy: boolean;
  onUpdate: (patch: Partial<AdsConfig>) => void;
};

const LAYOUTS: { value: AdsLayout; title: string; note: string }[] = [
  {
    value: 'inline',
    title: 'In the home scroll',
    note: 'Between Today’s page and Trails. Scrolls with the page.',
  },
  {
    value: 'anchored',
    title: 'Above the bottom edge',
    note: 'Pinned above the safe area while the home screen is open.',
  },
];

function AdPreview({ ads }: { ads: AdsConfig }) {
  const bannerActive = (ads.bannerEnabled ?? ads.enabled) === true;
  const rewardedActive = ads.rewardedEnabled === true;

  const slot = (
    <div className="ad-preview-slot">
      <span className="ad-preview-tag">Ad</span>
      <span className="ad-preview-copy">
        {bannerActive
          ? ads.testMode
            ? 'Google test banner'
            : 'Live banner'
          : 'Banner off'}
      </span>
    </div>
  );

  return (
    <div className="ad-preview-frame" data-layout={ads.layout}>
      <div className="ad-preview-status">
        <span>9:41</span>
        <span className="ad-preview-status-right">Nexus</span>
      </div>
      <div className="ad-preview-body">
        <div className="ad-preview-brand">
          <span className="ad-preview-mark" aria-hidden="true" />
          <span className="ad-preview-wordmark">Nexus</span>
        </div>
        <p className="ad-preview-headline">
          The web,
          <br />
          <em>uncluttered.</em>
        </p>
        <div className="ad-preview-search">Search or enter a website</div>
        <div className="ad-preview-label">Today&rsquo;s page</div>
        <div className="ad-preview-card" />
        {ads.layout === 'inline' && bannerActive ? slot : null}
        <div className="ad-preview-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Shortcuts</span>
          {rewardedActive ? (
            <span style={{ fontSize: '10px', color: 'var(--color-accent-deep, #b45309)', fontWeight: 600 }}>
              Ad on tap
            </span>
          ) : null}
        </div>
        <div className="ad-preview-trail" />
      </div>
      {ads.layout === 'anchored' && bannerActive ? slot : null}
    </div>
  );
}

export function AdsEditor({ ads, busy, onUpdate }: Props) {
  const bannerActive = (ads.bannerEnabled ?? ads.enabled) === true;
  const rewardedActive = ads.rewardedEnabled === true;
  const anyActive = bannerActive || rewardedActive;

  // Banner validation
  const androidError =
    ads.androidUnitId && !isAdUnitId(ads.androidUnitId)
      ? 'Expected ca-app-pub-<16 digits>/<10 digits>.'
      : '';
  const iosError =
    ads.iosUnitId && !isAdUnitId(ads.iosUnitId)
      ? 'Expected ca-app-pub-<16 digits>/<10 digits>.'
      : '';
  const needsBannerUnit =
    bannerActive &&
    !ads.testMode &&
    !isAdUnitId(ads.androidUnitId) &&
    !isAdUnitId(ads.iosUnitId);

  // Rewarded validation
  const androidRewardedError =
    ads.androidRewardedUnitId && !isAdUnitId(ads.androidRewardedUnitId)
      ? 'Expected ca-app-pub-<16 digits>/<10 digits>.'
      : '';
  const iosRewardedError =
    ads.iosRewardedUnitId && !isAdUnitId(ads.iosRewardedUnitId)
      ? 'Expected ca-app-pub-<16 digits>/<10 digits>.'
      : '';
  const needsRewardedUnit =
    rewardedActive &&
    !ads.testMode &&
    !isAdUnitId(ads.androidRewardedUnitId || '') &&
    !isAdUnitId(ads.iosRewardedUnitId || '');

  return (
    <div className="work-grid ads-grid">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Advertising</h2>
            <p className="panel-sub">
              Manage in-app ad units. Enable or disable banner and rewarded ads
              independently, or activate both simultaneously.
            </p>
          </div>
          <span className="editor-status" data-live={anyActive}>
            {anyActive ? 'Active' : 'Off'}
          </span>
        </div>

        <div className="ad-stage">
          {/* Global Test Mode */}
          <div className="ad-toggle-row">
            <div className="ad-toggle-copy">
              <p className="ad-toggle-title">Test mode (Global)</p>
              <p className="ad-toggle-note">
                Google test units, safe to tap during development. Turn off
                when publishing live AdMob inventory.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ads.testMode}
              aria-label="Use Google test ads"
              className="ad-switch"
              data-on={ads.testMode}
              disabled={busy}
              onClick={() => onUpdate({ testMode: !ads.testMode })}
            >
              <span className="ad-switch-thumb" />
            </button>
          </div>

          {ads.testMode ? (
            <p className="ad-note" style={{ marginTop: '0.75rem', marginBottom: '1.25rem' }}>
              Test mode is on. The app requests Google&rsquo;s official test units,
              so live ad unit IDs below are safely preserved without serving live ads.
            </p>
          ) : (
            <p className="ad-note ad-note--warn" style={{ marginTop: '0.75rem', marginBottom: '1.25rem' }}>
              Live mode is active. Real AdMob units are requested. Ensure consent forms
              and app-ads.txt are configured.
            </p>
          )}

          {/* Section 1: Banner Ads */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: 'var(--rule-hair) solid var(--color-rule)' }}>
            <div className="ad-toggle-row">
              <div className="ad-toggle-copy">
                <p className="ad-toggle-title">1. Home Screen Banner</p>
                <p className="ad-toggle-note">
                  Adaptive banner placement on the Nexus home screen.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={bannerActive}
                aria-label="Enable home banner"
                className="ad-switch"
                data-on={bannerActive}
                disabled={busy}
                onClick={() =>
                  onUpdate({
                    bannerEnabled: !bannerActive,
                    enabled: !bannerActive,
                  })
                }
              >
                <span className="ad-switch-thumb" />
              </button>
            </div>

            <fieldset className="ad-fields" disabled={busy || !bannerActive}>
              <fieldset className="ad-layout-fieldset">
                <legend className="field-label">Banner Placement</legend>
                <div className="ad-layout-options">
                  {LAYOUTS.map((layout) => (
                    <label
                      key={layout.value}
                      className="ad-layout-option"
                      data-selected={ads.layout === layout.value}
                    >
                      <input
                        type="radio"
                        name="ads-layout"
                        value={layout.value}
                        checked={ads.layout === layout.value}
                        onChange={() => onUpdate({ layout: layout.value })}
                        disabled={busy || !bannerActive}
                      />
                      <span className="ad-layout-copy">
                        <span className="ad-layout-title">{layout.title}</span>
                        <span className="ad-layout-note">{layout.note}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="field">
                <label className="field-label" htmlFor="ads-android-unit">
                  Android banner ad unit
                </label>
                <input
                  id="ads-android-unit"
                  className="input"
                  value={ads.androidUnitId}
                  onChange={(event) =>
                    onUpdate({ androidUnitId: event.target.value })
                  }
                  placeholder="ca-app-pub-0000000000000000/0000000000"
                  maxLength={64}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={androidError ? true : undefined}
                  aria-describedby="ads-android-hint ads-android-error"
                />
                <span className="field-hint" id="ads-android-hint">
                  AdMob → Apps → Nexus → Ad units → Banner
                </span>
                <span className="field-error" id="ads-android-error">
                  {androidError}
                </span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="ads-ios-unit">
                  iOS banner ad unit
                </label>
                <input
                  id="ads-ios-unit"
                  className="input"
                  value={ads.iosUnitId}
                  onChange={(event) =>
                    onUpdate({ iosUnitId: event.target.value })
                  }
                  placeholder="ca-app-pub-0000000000000000/0000000000"
                  maxLength={64}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={iosError ? true : undefined}
                  aria-describedby="ads-ios-hint ads-ios-error"
                />
                <span className="field-hint" id="ads-ios-hint">
                  Leave blank if iOS is not yet configured.
                </span>
                <span className="field-error" id="ads-ios-error">
                  {iosError}
                </span>
              </div>

              {needsBannerUnit ? (
                <p className="ad-note ad-note--warn" role="alert">
                  Banner is enabled in Live mode: please provide a valid Android or iOS banner unit ID.
                </p>
              ) : null}
            </fieldset>
          </div>

          {/* Section 2: Rewarded Interstitial Ads */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: 'var(--rule-hair) solid var(--color-rule)' }}>
            <div className="ad-toggle-row">
              <div className="ad-toggle-copy">
                <p className="ad-toggle-title">2. Rewarded Interstitial (Shortcuts)</p>
                <p className="ad-toggle-note">
                  Presents a rewarded interstitial ad when a user taps any shortcut on the home screen, then opens the site.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={rewardedActive}
                aria-label="Enable rewarded interstitial"
                className="ad-switch"
                data-on={rewardedActive}
                disabled={busy}
                onClick={() =>
                  onUpdate({
                    rewardedEnabled: !rewardedActive,
                  })
                }
              >
                <span className="ad-switch-thumb" />
              </button>
            </div>

            <fieldset className="ad-fields" disabled={busy || !rewardedActive}>
              <div className="field">
                <label className="field-label" htmlFor="ads-android-rewarded-unit">
                  Android rewarded ad unit
                </label>
                <input
                  id="ads-android-rewarded-unit"
                  className="input"
                  value={ads.androidRewardedUnitId ?? ''}
                  onChange={(event) =>
                    onUpdate({ androidRewardedUnitId: event.target.value })
                  }
                  placeholder="ca-app-pub-0000000000000000/0000000000"
                  maxLength={64}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={androidRewardedError ? true : undefined}
                  aria-describedby="ads-android-rewarded-hint ads-android-rewarded-error"
                />
                <span className="field-hint" id="ads-android-rewarded-hint">
                  AdMob → Apps → Nexus → Ad units → Rewarded interstitial
                </span>
                <span className="field-error" id="ads-android-rewarded-error">
                  {androidRewardedError}
                </span>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="ads-ios-rewarded-unit">
                  iOS rewarded ad unit
                </label>
                <input
                  id="ads-ios-rewarded-unit"
                  className="input"
                  value={ads.iosRewardedUnitId ?? ''}
                  onChange={(event) =>
                    onUpdate({ iosRewardedUnitId: event.target.value })
                  }
                  placeholder="ca-app-pub-0000000000000000/0000000000"
                  maxLength={64}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={iosRewardedError ? true : undefined}
                  aria-describedby="ads-ios-rewarded-hint ads-ios-rewarded-error"
                />
                <span className="field-hint" id="ads-ios-rewarded-hint">
                  Leave blank if iOS is not yet configured.
                </span>
                <span className="field-error" id="ads-ios-rewarded-error">
                  {iosRewardedError}
                </span>
              </div>

              {needsRewardedUnit ? (
                <p className="ad-note ad-note--warn" role="alert">
                  Rewarded ads are enabled in Live mode: please provide a valid Android or iOS rewarded unit ID.
                </p>
              ) : null}
            </fieldset>
          </div>
        </div>
      </div>

      <div className="editor ad-preview-editor">
        <div className="editor-head">
          <div>
            <h2 className="editor-title">Ad Formats Preview</h2>
            <p className="editor-id">Home screen placement</p>
          </div>
          <span className="editor-status" data-live={anyActive}>
            {anyActive ? (ads.testMode ? 'Test' : 'Live') : 'Hidden'}
          </span>
        </div>
        <div className="editor-body">
          <AdPreview ads={ads} />
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-sheet)', borderRadius: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--color-muted)' }}>Banner ad:</span>
              <span style={{ fontWeight: 600 }}>{bannerActive ? (ads.testMode ? 'Active (Test)' : 'Active (Live)') : 'Disabled'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>Rewarded ad (Shortcuts):</span>
              <span style={{ fontWeight: 600 }}>{rewardedActive ? (ads.testMode ? 'Active (Test)' : 'Active (Live)') : 'Disabled'}</span>
            </div>
          </div>
          <p className="ad-preview-footnote" style={{ marginTop: '0.75rem' }}>
            Multiple ad units can be active simultaneously. When a user taps any shortcut, the rewarded ad will display if enabled, after which the destination URL opens.
          </p>
        </div>
      </div>
    </div>
  );
}
