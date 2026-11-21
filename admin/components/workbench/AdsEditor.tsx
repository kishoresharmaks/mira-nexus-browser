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
  const slot = (
    <div className="ad-preview-slot">
      <span className="ad-preview-tag">Ad</span>
      <span className="ad-preview-copy">
        {ads.enabled
          ? ads.testMode
            ? 'Google test banner'
            : 'Live banner'
          : 'Ads are off'}
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
        {ads.layout === 'inline' ? slot : null}
        <div className="ad-preview-label">Trails</div>
        <div className="ad-preview-trail" />
      </div>
      {ads.layout === 'anchored' ? slot : null}
    </div>
  );
}

export function AdsEditor({ ads, busy, onUpdate }: Props) {
  const androidError =
    ads.androidUnitId && !isAdUnitId(ads.androidUnitId)
      ? 'Expected ca-app-pub-<16 digits>/<10 digits>.'
      : '';
  const iosError =
    ads.iosUnitId && !isAdUnitId(ads.iosUnitId)
      ? 'Expected ca-app-pub-<16 digits>/<10 digits>.'
      : '';
  const needsUnit =
    ads.enabled &&
    !ads.testMode &&
    !isAdUnitId(ads.androidUnitId) &&
    !isAdUnitId(ads.iosUnitId);

  return (
    <div className="work-grid ads-grid">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Advertising</h2>
            <p className="panel-sub">
              One banner, on the home screen only. Never in the browser, a
              private tab, a sheet, or Settings.
            </p>
          </div>
          <span className="editor-status" data-live={ads.enabled}>
            {ads.enabled ? 'On' : 'Off'}
          </span>
        </div>

        <div className="ad-stage">
          <div className="ad-toggle-row">
            <div className="ad-toggle-copy">
              <p className="ad-toggle-title">Show the home banner</p>
              <p className="ad-toggle-note">
                Turning this off removes the placement from the next published
                catalog. The app never blocks on an ad request.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ads.enabled}
              aria-label="Show the home banner"
              className="ad-switch"
              data-on={ads.enabled}
              disabled={busy}
              onClick={() => onUpdate({ enabled: !ads.enabled })}
            >
              <span className="ad-switch-thumb" />
            </button>
          </div>

          <fieldset className="ad-fields" disabled={busy || !ads.enabled}>
            <div className="ad-toggle-row">
              <div className="ad-toggle-copy">
                <p className="ad-toggle-title">Test mode</p>
                <p className="ad-toggle-note">
                  Google test units, safe to tap. A development build always
                  forces test units even when this is off.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={ads.testMode}
                aria-label="Use Google test ads"
                className="ad-switch"
                data-on={ads.testMode}
                disabled={busy || !ads.enabled}
                onClick={() => onUpdate({ testMode: !ads.testMode })}
              >
                <span className="ad-switch-thumb" />
              </button>
            </div>

            <fieldset className="ad-layout-fieldset">
              <legend className="field-label">Placement</legend>
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
                      disabled={busy || !ads.enabled}
                    />
                    <span className="ad-layout-copy">
                      <span className="ad-layout-title">{layout.title}</span>
                      <span className="ad-layout-note">{layout.note}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {ads.testMode ? (
              <p className="ad-note">
                Test mode is on. The app requests Google&rsquo;s adaptive test
                banner, so real ad units below are ignored until test mode is
                turned off.
              </p>
            ) : (
              <p className="ad-note ad-note--warn">
                Live mode. Use real AdMob unit IDs below. Nexus asks for UMP
                consent, then iOS tracking permission, before the SDK
                initializes.
              </p>
            )}

            <div className="field">
              <label className="field-label" htmlFor="ads-android-unit">
                Android ad unit
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
                AdMob → Apps → Nexus → Ad units. One adaptive banner unit is
                enough.
              </span>
              <span className="field-error" id="ads-android-error">
                {androidError}
              </span>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="ads-ios-unit">
                iOS ad unit
              </label>
              <input
                id="ads-ios-unit"
                className="input"
                value={ads.iosUnitId}
                onChange={(event) => onUpdate({ iosUnitId: event.target.value })}
                placeholder="ca-app-pub-0000000000000000/0000000000"
                maxLength={64}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={iosError ? true : undefined}
                aria-describedby="ads-ios-hint ads-ios-error"
              />
              <span className="field-hint" id="ads-ios-hint">
                Leave blank if Nexus is not shipping on iOS yet.
              </span>
              <span className="field-error" id="ads-ios-error">
                {iosError}
              </span>
            </div>

            {needsUnit ? (
              <p className="ad-note ad-note--warn" role="alert">
                Live mode needs at least one valid unit ID. Add an Android or
                iOS unit, or turn test mode back on.
              </p>
            ) : null}
          </fieldset>
        </div>
      </div>

      <div className="editor ad-preview-editor">
        <div className="editor-head">
          <div>
            <h2 className="editor-title">Where it lands</h2>
            <p className="editor-id">Home screen preview</p>
          </div>
          <span className="editor-status" data-live={ads.enabled}>
            {ads.enabled ? (ads.testMode ? 'Test' : 'Live') : 'Hidden'}
          </span>
        </div>
        <div className="editor-body">
          <AdPreview ads={ads} />
          <p className="ad-preview-footnote">
            The real banner is adaptive and collapses to nothing when it cannot
            fill. The app does not reserve an empty slot.
          </p>
        </div>
      </div>
    </div>
  );
}
