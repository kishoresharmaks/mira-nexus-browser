# Mira

A quieter browser for the web.

Mira opens ordinary websites in a full-screen WebView with a small, considered
set of controls. It groups browsing into **Trails**, keeps up to **five tabs**
alive while the app is open, offers **Today's page** — one hand-picked,
independent page a day — and **Private tabs** that leave no history, bypass the
page cache, and block screen capture. It also shows the public **Hacker News and
Lobsters** conversation around a page in a native overlay. No account, no feed,
no analytics, no advertising.

The visual language is warm and editorial: paper, ink, a single orange accent,
Instrument Serif for display type and Instrument Sans for everything else. Light
and dark themes follow the system on first launch and remember your choice.

Built with Expo SDK 58, React Native 0.88, React 19, TypeScript, and Expo Router.

---

## Features

### Browsing

- Full browser on `react-native-webview`: back, forward, reload, stop, loading
  progress, pull-to-refresh on iOS, and a designed error state.
- One omnibox. Bare domains become websites; plain words become a private
  DuckDuckGo search. Search results are never written to history.
- HTTPS-only top-level navigation. Public HTTP addresses are upgraded to HTTPS.
- Site-owned favicons fetched directly from each host (no third-party icon
  service).
- Copy link, share, open in the system browser, and return home from the page
  menu.
- Crash recovery: a renderer crash remounts the WebView instead of blanking the
  screen.

### Trails

- Pages visited within about 25 minutes of each other form a trail.
- The newest trail appears on the home screen as a compact card with a dot row:
  one dot per page, the last one accented.
- Resume a trail by opening any of its pages, rename it, or delete it.
- Trails own copies of their pages, so trimming history never breaks a trail.
- Capped at 30 trails and 40 pages per trail. Clearing history clears trails too.

### Tabs

- Up to five open pages, shown in a two-column grid from the toolbar.
- Tabs mount immediately and stay alive while the app is open, so scroll
  position and form state survive switching.
- Opening a sixth tab evicts the least-recently-active tab, with a toast.
- Tabs are in-memory by design and clear when the app closes. History and trails
  persist.
- Inactive tabs pause media and background work.

### Private tabs

- Open a private tab from the home header, the tab sheet, or any page menu. It
  begins on a local start page: no WebView, no network request, and no page
  state exists until you choose an address.
- Private tabs write no history or trails and load pages with WebView's cache
  bypassed. The omnibox hides your stored history while you are in the room.
- **Android's WebView has one cookie and site-storage store for the whole app.**
  Private tabs share it with normal tabs: a site you are signed in to can
  recognize you, and cookies set in a private tab can outlive it. The private
  start page says this before you open an address. iOS uses a non-persistent
  store, but Android is the publishing target.
- Discussion lookup is off in private tabs, so the page address is never sent to
  Hacker News or Lobsters.
- Screenshots and screen recordings are blocked on native builds through
  `expo-screen-capture`, and the app switcher receives a quiet screen instead of
  the page.
- Private chrome uses a dedicated night palette, separate from your chosen
  appearance. The tab sheet keeps private pages in their own group with a
  one-tap close-all.
- Private tabs are still WebViews: a site sees your IP address and knows someone
  visited. Mira hides your trail in Mira, not your identity on the web.

### Public discussions

- When an article has been posted to Hacker News or Lobsters, a small chip appears
  above the toolbar with its score and comment count.
- Tap it to read the conversation in a native sheet: platform selector when both
  exist, points, comments, nested replies, and a one-tap "Open thread" action.
- Lookup is by canonical address: `http`/`https`, `www.`, trailing slashes,
  fragments, and common tracking parameters are normalised before matching.
- Search-result pages, the discussion sites themselves, private hosts, and every
  private tab are skipped. Nothing is looked up while the page is still loading.
- Only the current page address is sent, directly to the Algolia HN Search API
  and Lobsters. There is no developer server, no account, no stored lookup
  history, and no analytics.
- Results are cached in memory for 15 minutes and never written to history or
  trails. The setting is on by default and can be turned off in the sheet.
- Lobsters lookup is skipped in the web preview because its API has no CORS
  headers; the Android build queries both sources.

### Today's page

- One curated, evergreen page per local calendar day, chosen from a bundled list
  of 22 independent essays and small sites.
- No server request to choose it. The page is only fetched when you tap through.
- Archive of the last ten days.
- Also available on the Android home-screen widget.

### Share intake

- Share a link from any app into Mira: it opens in a new tab.
- Share plain text: Mira opens the address overlay with the text prefilled.
- Strict validation: only `http(s)` is accepted, HTTP is upgraded, credentials
  in the URL are rejected, and other schemes are ignored.
- Non-web files and images are not requested or read.

### Android home-screen widget

- 4×2 resizable widget with Today's page, a footer call to action, and up to three
  shortcuts when resized taller.
- Light and dark variants.
- Updates every 30 minutes, when shortcuts change, and when the app returns to
  the foreground.
- Widget clicks use `mira://open?url=…` deep links.
- Plain Android RemoteViews only: no web content, no network images, no remote
  code.
- iOS widgets are intentionally not implemented.

### Craft

- Custom SVG icon set and brand mark; generated app icon, adaptive icon,
  monochrome icon, splash screens, favicon, Play feature graphic, and widget
  preview.
- Safe-area-aware layout, haptics, reduced-motion-aware transitions, and a
  screen-reader-friendly control set.
- Local history (last 100 pages) grouped by day, with two-step clear.
- Shortcuts grid with undo on removal.

---

## Requirements

- Node 20+
- Android Studio / Android SDK for local native builds, or an EAS account for
  cloud builds
- A physical Android device for share-sheet and widget testing

Expo Go can preview the core browser on Android because `react-native-webview`
is bundled. **Share intake, the widget, and the private-tab screen-capture
shield require a development build** — their native modules are not in Expo Go.
Private tabs still work without the shield, with the app-switcher veil as a
fallback.

---

## Run it

```bash
npm install
npx expo start
```

Open the QR code in Expo Go for core browsing, or use a development build:

```bash
npx expo run:android          # local build, requires Android SDK
# or
npx eas-cli@latest build --profile development --platform android
```

### Web preview

`react-native-webview` is native-only, so `src/components/BrowserPane.web.tsx`
provides an iframe fallback for design QA. Many sites refuse to be framed; for a
faithful look at the browser chrome, open `http://localhost:8081/demo.html` from
the address bar. `public/demo.html` is a self-contained editorial demo.

The web build is a QA surface, not a shipped target. Its private tabs reproduce
the chrome, the empty start page, and the history suppression, but an iframe
cannot isolate cookies (the Android build shares them too) or block screen
capture.

### Quality gates

```bash
npx tsc --noEmit        # typecheck
npx expo lint           # lint
npx expo-doctor         # dependency + config diagnostics
npx expo install --check
```

Run all four before declaring a change done.

---

## Security model

Mira is a browser, so the threat model is "untrusted web content inside a native
shell." The defaults are deliberately strict.

| Area | Behaviour |
| --- | --- |
| Top-level transport | HTTPS only. Public HTTP is upgraded; cleartext traffic is disabled at the Android network layer. |
| Mixed content | Never allowed. |
| Local files | File access, file-URL access, and form-data saving are disabled. `file://` cannot become the top-level document. |
| Cookies | First-party on; third-party off. Sign-ins work without cross-site tracking. |
| Private tabs | No history or trails, cache bypassed, no discussion lookup, and screen capture blocked. Android shares cookies and site storage with normal tabs; see below. |
| Screen capture | Blocked while a private tab is open on native builds. A quiet veil covers the app switcher, and sheets close when Mira backgrounds. |
| JavaScript windows | `window.open` cannot spawn native windows. |
| Geolocation | Denied. Location permission is not requested. |
| Camera / microphone | Capture denied; permissions removed from the manifest. |
| External schemes | Allowlist only: `mailto:`, `tel:`, `sms:`, `geo:`. |
| Android Safe Browsing | Explicitly enabled in the manifest. |
| WebView metrics | Opted out of Google reporting. |
| Debugging | WebView debugging is enabled in development only. |
| Backup | `allowBackup=false`; local browsing data is not copied to Google Drive. |
| Permissions | `INTERNET` and `VIBRATE` only. Camera, microphone, location, storage, contacts, SMS, notifications, overlay, and package-query permissions are blocked. |
| Release build | Minified and resource-shrunk; no analytics, ads, or crash SDK. |
| Share intake | Length-capped, control characters stripped, http(s) only, credentials rejected, plain text never auto-navigated. |
| Widget | RemoteViews only; reads validated local storage; no network or remote code. |

Android's WebView exposes one cookie and DOM-storage store per app, so private
tabs cannot be cookie-isolated without a native WebView profile. Mira does not
use `react-native-webview`'s `incognito` prop on Android because it calls
`CookieManager.removeAllCookies` globally and would sign normal tabs out. The
private start page and the private sheet state the shared store plainly. On
iOS, `incognito` is safe: it uses a non-persistent `WKWebsiteDataStore`.

`plugins/with-webview-hardening.js` writes the Safe Browsing and metrics
metadata into the Android manifest. Security-relevant flags live in `app.json`,
`BrowserPane.tsx`, and `src/lib/url.ts`.

The full policy is in [PRIVACY.md](PRIVACY.md) and the hostable version is
[docs/privacy.html](docs/privacy.html).

---

## Structure

```
index.ts                    custom entry; registers the widget task handler
src/
  app/
    _layout.tsx             fonts, splash, safe area, theme, toast, stack
    index.tsx               app shell: tabs, trails, Today, share, deep links
    +native-intent.tsx      routes widget/share links to the single screen
  components/
    HomeScreen.tsx          Today, latest trail, open-tabs strip, shortcuts, recents
    TodayCard.tsx           inverse editorial Today card
    TrailCard.tsx           latest-trail card with dot row
    TrailDots.tsx           one dot per page
    TabsSheet.tsx           two-column open-tabs grid
    TrailsSheet.tsx         resume / rename / delete trails
    TodaySheet.tsx          ten-day archive
    PrivateStart.tsx        private-tab start page, search dock, assurances
    PrivateSheet.tsx        plain-language privacy contract and close-all
    PrivateVeil.tsx         app-switcher cover for private pages
    AddressOverlay.tsx      omnibox with suggestions and private mode
    BrowserPane.tsx         native WebView, progress, security policy, crash recovery
    BrowserPane.web.tsx     iframe stand-in for web QA
    BrowserToolbar.tsx      floating chrome, discussion chip, tab count, menu
    CommunityChip.tsx       score/comment chip above the toolbar
    CommunitySheet.tsx      HN/Lobsters thread, comment tree, lookup toggle
    MenuSheet.tsx           page actions, discussions, tabs/trails, appearance
    HistorySheet.tsx        grouped local history
    ...                     icon system, favicons, sheets, toasts, press states
  lib/
    url.ts                  URL parsing, HTTPS upgrade, private-host checks, favicons
    inbound.ts              share/deep-link validation
    trails.ts               trail grouping, caps, normalization
    curation.ts             bundled Today list and daily rotation
    history.ts              history entries and normalization
    privateShield.ts        optional expo-screen-capture bridge
    community.ts            HN/Lobsters lookup, canonical URLs, comments, cache
    shortcuts.ts            default shortcuts and normalization
    storage-keys.ts         storage keys, tab cap, trail gap
    usePersistentState.ts   typed AsyncStorage state with normalization
    useLatest.ts            ref that never writes during render
    useAnimatedValue.ts     RN 0.88 animated value helper
  widgets/
    MiraWidget.tsx          widget layout and typography
    widget-data.ts          validated snapshot from AsyncStorage
    update-widget.tsx       requestWidgetUpdate wrapper
    widget-task-handler.tsx headless render handler
  theme/                    design tokens and persisted theme provider
plugins/
  with-webview-hardening.js Safe Browsing + metrics opt-out manifest metadata
assets/
  widget-fonts/             fonts copied into Android assets
  widget-preview/           widget picker preview
docs/
  privacy.html              hostable privacy policy
  play/feature-graphic.png  1024×500 Play feature graphic
  play/screenshots/         eight Play phone captures
public/demo.html            web-preview reading page
scripts/generate-assets.mjs brand asset generation
```

---

## Build and publish

Native projects are generated (CNG). Never hand-edit `android/` or `ios/`.

```bash
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest submit --profile production --platform android
```

`eas.json` defines development, preview, and production profiles. Production
builds an `.aab`, auto-increments `versionCode`, and submits to the internal
track by default.

Before publishing:

1. Replace `REPLACE_WITH_YOUR_EMAIL@example.com` in `PRIVACY.md` and
   `docs/privacy.html`.
2. Host `docs/privacy.html` at a public HTTPS URL.
3. Follow [PLAY_STORE.md](PLAY_STORE.md) for listing copy, screenshots, Data
   safety, content rating, and the review checklist.
4. On a physical Android device, open a private tab and confirm that
   screenshots are blocked and the app-switcher thumbnail is blank.

Play Console requirements change; the guide calls out what to verify at
submission.

---

## Notes and limitations

- **Android is the publishing target.** iOS configuration exists, but the share
  extension has not been verified on a Mac and there is no iOS widget.
- **Five tabs is a hard cap**, chosen to bound memory. The sixth tab evicts the
  least-recently-active one.
- **Tabs do not survive a cold launch.** Only history, trails, shortcuts, and
  theme persist.
- **Private tabs hide Mira's traces, not network identity.** A private tab writes
  no history, bypasses the cache, and blocks capture, but Android shares cookies
  with normal tabs and the site still receives your IP address. Mira does not
  proxy or anonymise traffic.
- **The capture shield needs a native build.** Expo Go and the web preview show
  the app-switcher veil only; the OS-level block is active once
  `expo-screen-capture` is in the development or production binary.
- **No ad blocker.** Third-party cookies are off, but network requests are not
  filtered.
- **No sync.** There is no account and no cloud.
- **Some sites do not work in a WebView** or require their native app. That is a
  site decision.
- **The web build cannot render frame-blocked sites** by design.
- **Today's page is editorial, not algorithmic.** It rotates locally and does not
  learn from your reading.
- **Discussion matching is by address.** A thread posted with a substantially
  different URL will not match, and the sheet is read-only: it shows the first
  120 comments to six levels and links out for the rest.
- **Build-time audit noise.** `npm audit --omit=dev` reports high findings in
  `node-forge` and `zod` pulled in by `@expo/cli`; they are build tooling, not
  shipped runtime code, and Expo does not yet offer a patched line.

---

## License

Private project. Fonts are licensed under the SIL Open Font License via
`@expo-google-fonts`. Brand assets are original to this project.
