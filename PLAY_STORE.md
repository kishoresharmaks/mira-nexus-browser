# Publishing Mira to Google Play

Everything in this file is written for the app as it exists in this repository:
package `com.mira.browser`, version `1.0.0`, Android-only release, Expo SDK 58
(target API 36), no account, one optional home-screen banner served by Google
AdMob, no analytics.

Play Console requirements change. Treat the "verify at submission" notes as part
of the checklist, not as optional reading.

---

## 1. At a glance

| Field | Value |
| --- | --- |
| App name | **Mira — A Quieter Browser** (24 characters) |
| Package | `com.mira.browser` |
| Version | `1.0.0` (versionCode `1`, auto-incremented by EAS on production builds) |
| Category | **Tools** |
| Tags | Browser, Reading, Productivity |
| Pricing | Free, no in-app purchases |
| Ads | **Yes** — one adaptive banner on the home screen, served by Google AdMob |
| Account required | No |
| Platforms | Android phone and tablet (portrait) |
| Privacy policy | `https://REPLACE_WITH_YOUR_DOMAIN/privacy.html` |
| Support email | `REPLACE_WITH_YOUR_EMAIL@example.com` |

Mira is a general-purpose browser. It does not require a login and does not send
browsing data to the developer. One optional adaptive banner on the home screen
is served by Google AdMob; it never appears in the browser, private tabs, sheets,
or Settings. The Google Mobile Ads SDK can receive an advertising ID, IP address,
app interactions, and diagnostics for ad delivery, measurement, and fraud
prevention, so the Data safety form declares those types as shared with Google.
Where required, Mira gathers UMP consent before initializing the SDK, and the app
offers a privacy-choices button in Settings. The optional discussion lookup sends
the current page address to two public discussion services, so the Data safety
form declares that share as well; the developer collects nothing. Mira also
fetches a small public catalog of search presets, Today pages, and ad settings;
that request carries no account, device ID, query, or browsing history, and the
app keeps a bundled fallback. Private tabs write no history, bypass the page
cache, block screen capture, and never trigger the discussion lookup. On Android,
cookies and site storage are shared with normal tabs, so a site may still
recognize you. The privacy policy must be publicly reachable before the first
review.

---

## 2. Store listing copy

### App name (max 30 characters)

```
Mira — A Quieter Browser
```

### Short description (max 80 characters)

```
A quieter browser: trails, five tabs, private rooms, and one page a day.
```

### Full description (max 4,000 characters)

```
Mira is a browser for reading, not scrolling.

It opens ordinary websites in a clean, full-screen view with only the controls you need. No feed, no account, no analytics, and only one small home-screen banner. Your history, trails, shortcuts, search choice, and theme stay on your device.

TRAILS
Mira groups the pages you visit into trails. Read for a while, wander through a few links, then put the phone down. When you come back, the trail is waiting: a row of dots showing where you were. Resume it, rename it, or delete it.

FIVE TABS, KEPT ALIVE
Open up to five pages and move between them without losing your place. Tap the tab count to see every open page as a grid. Close one to release it. Tabs live in memory and clear when the app closes.

SEARCH, YOUR WAY
Mira ships with a small set of private search presets, and you can add any HTTPS search site you trust. The choice lives on your device; your query goes to the engine you picked, not to Mira.

PRIVATE TABS
Private tabs never write history or trails, hide stored history in the address field, bypass the page cache, and skip discussion lookup. They open on a quiet local page, so no request is made until you choose an address. Android's WebView shares cookies and site storage with normal tabs, so a site may remember you. While one is open, Android blocks screenshots and recordings and blanks the app-switcher preview. Close the tab, or the whole group, and its pages are gone.

TODAY'S PAGE
One hand-picked, independent page each day: an essay, a garden, a small corner of the web worth an unhurried minute. It rotates with your local calendar. The list comes from a small public catalog and is cached on your device, so it works offline; a copy is bundled in the app. The catalog request carries no account, device ID, or browsing history. The page is fetched only when you tap it; the last ten days stay in an archive.

PUBLIC DISCUSSIONS
When you open an article, Mira can quietly check whether it has been posted to Hacker News or Lobsters. If a public thread exists, a small chip appears above the toolbar with its score and comment count. Tap it for the conversation in a native sheet, with points, nested replies, and a path to the original thread. Only the current page address is sent to those services. The setting is on by default and can be turned off in the Discussions sheet; results stay in memory and are never written to history.

SHARE INTO MIRA
Send a link from any app's share sheet and it opens in a new tab. Share plain text and Mira places it in the address field, ready to search.

ANDROID HOME-SCREEN WIDGET
Put Today's page on your home screen. The widget also shows up to three shortcuts when there is room. Tap any to open Mira. It updates through the day and follows your theme.

ONE QUIET HOME-SCREEN BANNER
Mira can show a single adaptive banner on the home screen, served by Google AdMob. It never appears while you browse, in private tabs, in sheets, or in Settings. Where required, Mira asks for consent before requesting an ad, and Settings offers a button to review or withdraw your ad choices. Google may use your advertising ID, IP address, app interactions, and diagnostics to serve, measure, and protect that ad. The developer does not receive that data.

PRIVATE BY CONSTRUCTION
• No account, sign-in, analytics, or crash-reporting SDK.
• One small home-screen banner, served by Google AdMob; no ads in the browser, private tabs, sheets, or Settings.
• History, trails, search choice, and theme stay on your device.
• Android backup is disabled, so browsing data is not copied to Google Drive.
• HTTPS-only top-level browsing; public HTTP links are upgraded.
• Third-party cookies are disabled and mixed content is blocked.
• Search engines are yours: private presets plus any HTTPS engine you add. The catalog request carries no account, device ID, or browsing history.
• Discussion lookup sends only the current page address, and can be switched off.
• File access, geolocation, camera, and microphone are denied inside pages.
• External links are limited to mail, phone, SMS, and maps.
• Android Safe Browsing stays on.
• Delete history and trails at any time from the page menu.

A SMALL, CONSIDERED INTERFACE
Warm paper, ink, a single orange accent. Instrument Serif for headlines, Instrument Sans for everything else. Light and dark themes follow your system and remember your choice.

The web is as open as the web is. Mira does not filter what you can read, and it does not pretend every site is safe.

No account. No feed. No noise.
```

### What's new (first release, max 500 characters)

```
First release.

• Trails: browsing grouped into sessions you can resume
• Five tabs with a grid switcher
• Private tabs: no history, cache bypassed, screen-capture shield
• Search your way: private presets or your own HTTPS engine
• Today's page, hand-picked daily, with a ten-day archive
• Hacker News and Lobsters discussions, in a native overlay
• Share links and text into Mira
• Android home-screen widget
• HTTPS-only browsing, third-party cookies off, no analytics
• One quiet home-screen banner, clearly marked
• Light and dark themes
```

---

## 3. Graphics checklist

| Asset | Requirement | Status in this repo |
| --- | --- | --- |
| App icon | 512 × 512, 32-bit PNG, ≤1 MB | ✅ `assets/icon-512.png` |
| Feature graphic | 1024 × 500, JPEG or 24-bit PNG, no alpha | ✅ `docs/play/feature-graphic.png` |
| Phone screenshots | 2–8, 16:9 or 9:16, 320–3840 px, no alpha | ✅ eight captures in `docs/play/screenshots/` (780 × 1520, 24-bit PNG) |
| 7" tablet screenshots | Optional unless tablet-optimised listing | ⬜ only if claiming tablet support |
| 10" tablet screenshots | Optional unless tablet-optimised listing | ⬜ only if claiming tablet support |
| Promo video | Optional, YouTube URL | Not planned |

The screenshot set lives in `docs/play/screenshots/` and is ordered below. Each
image is 780 × 1520 px (a 390 × 760 viewport at DPR 2, 1.95:1), 24-bit PNG with
no alpha channel — inside Play's accepted range. `02-home-shelves.png` is cropped
to 780 × 1480 so the frame ends on a clean edge.

1. `01-home.png` — home from the top: hero, omnibox, Today's page.
2. `02-home-shelves.png` — the same screen below the hero: the latest trail with
   its dot row, shortcuts, and recent pages.
3. `03-today.png` — the Today archive sheet with the last ten days.
4. `04-trails.png` — the Trails sheet with three named trails.
5. `06-browser.png` — a real page in the browser, with the address and tab count.
6. `07-tabs.png` — four open tabs in the two-column grid.
7. `09-private.png` — a private tab's start page in the night palette, with its
   privacy assurances. This replaces the older address-overlay capture.
8. `08-discussions.png` — the native discussion sheet in dark mode, showing a
   live Hacker News thread over *The Slow Web*.

They were captured from the app's React Native interface through the web QA
harness (WebView replaced by an iframe), which is why no Android status bar is
visible. The discussion sheet in `08-discussions.png` contains real public Hacker
News data. Re-capture from a device build if you want the platform status bar;
the only other difference is that tabs show a real page title on native instead
of a hostname when the page is cross-origin.

Capture at a 2:1 or shorter aspect ratio. A 390 × 760 logical viewport at DPR 2
produces 780 × 1520 px, which is accepted. Avoid 20:9 phone captures
(390 × 844 → 2.16:1); Play can reject them as too tall.

Do not put device frames, marketing headlines, or fake UI into screenshots.
Google allows captioned screenshots, but Mira's design is the pitch; let it be
legible at thumbnail size. If you re-capture on a device, keep the status bar
clean: 9:41, full battery, no notifications, no debug banner.

---

## 4. Data safety form

Mira has no developer-operated server and the developer does not receive user
data. Two features send data to third parties:

1. The optional discussion lookup sends the current page address to Hacker News
   and Lobsters.
2. The home-screen banner uses the Google Mobile Ads SDK, which collects and
   shares ad data with Google.

Play treats data transmitted by an embedded SDK as collected by the app, so
declare the AdMob data types below as collected and shared even though the
developer never receives them. Play also lets a data type be shared without
being collected by the developer, which is how the discussion lookup is declared.

### Section: Data collection and security

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **Yes** — the optional discussion lookup shares the current page address with Hacker News and Lobsters; the Google Mobile Ads SDK collects and shares ad data with Google. The developer receives neither. |
| Is all of the user data collected by your app encrypted in transit? | **Yes** — HTTPS/TLS only; cleartext traffic is disabled |
| Do you provide a way for users to request that their data be deleted? | **Yes** — in-app History → Clear history removes Mira's lists; Android Settings → Apps → Mira → Storage → Clear storage removes cookies, site storage, and the UMP consent record; Android Settings → Privacy → Ads lets users reset or delete the advertising ID; the discussion lookup stores nothing on a server |

Data-type rows:

| Data type | Collected by app | Shared | Recipients | Purpose | Optional | Ephemeral | Encrypted |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Web browsing history (current page address only) | **No** | **Yes** | Algolia HN Search API (`hn.algolia.com`) for Hacker News; Lobsters (`lobste.rs`) | App functionality — find public discussion threads | **Yes** — "Look up discussions" can be turned off | **Yes** — held in memory for 15 minutes, never written to history or trails | **Yes** |
| Approximate location (estimated from IP address) | **Yes** — by the Google Mobile Ads SDK | **Yes** | Google AdMob | Advertising or marketing; Analytics; Fraud prevention, security, and compliance | **No** — consent-gated where required | **No** | **Yes** |
| App interactions (app launches, taps, video views) | **Yes** — by the Google Mobile Ads SDK | **Yes** | Google AdMob | Advertising or marketing; Analytics; Fraud prevention, security, and compliance | **No** — consent-gated where required | **No** | **Yes** |
| Device or other IDs (advertising ID, app set ID) | **Yes** — by the Google Mobile Ads SDK | **Yes** | Google AdMob | Advertising or marketing; Analytics; Fraud prevention, security, and compliance | **No** — consent-gated where required; the advertising ID can be reset or deleted in Android settings | **No** | **Yes** |
| Other app performance data (diagnostics: launch time, hang rate, energy usage) | **Yes** — by the Google Mobile Ads SDK | **Yes** | Google AdMob | Analytics; Fraud prevention, security, and compliance | **No** | **No** | **Yes** |

Where Google's UMP flow requires consent, refusing consent stops ad requests and
the SDK is not initialized. Users can reopen the consent form from Settings →
Advertising. The developer can also disable the placement entirely in the
published catalog.

The public catalog request is a plain HTTPS GET for a small configuration file.
It carries no account, device ID, search query, or browsing history, and Mira
does not use it to identify or profile anyone. Do not declare it as browsing
history. Like any HTTPS request, the hosting provider may keep standard request
logs (IP address, user agent) for security and reliability; those logs are not
used for analytics or personalisation. If the app later adds accounts, sync, or
analytics, this form must change before that release ships.

Do **not** declare the sites the user visits in the browser itself: those are
user-initiated requests to the sites, not collection by Mira. Do **not** declare
history, trails, shortcuts, private-tab history, or the theme as collected; Mira
never sends them to the developer. Private tabs also skip the discussion lookup
and unmount the ad banner, so neither their addresses nor their content reach
Hacker News, Lobsters, or the ad SDK. Cookies and site storage are set by the
sites the user visits and stay in Android's WebView; Mira does not collect them.
If a future release adds sync, crash reporting, or analytics, this form must
change before that release ships.

If the form requires a note, use:

```
Mira has no account, no analytics SDK, and no developer-operated server. History,
trails, shortcuts, and the theme are stored in Android app-private storage and
never leave the device. Private tabs write no history or trails, bypass the page
cache, block screen capture, and never run the discussion lookup or show an ad.
Android's WebView shares cookies and site storage with normal tabs, so a site may
recognize the reader; closing private tabs does not clear those cookies. As a
browser, Mira requests the sites the user opens directly, as any browser does.
The optional discussion lookup sends only the current page address to the public
Hacker News (Algolia) and Lobsters APIs; it sends no account, device identifier,
search terms, or browsing history, holds the response in memory for 15 minutes,
and never runs in a private tab. One adaptive banner on the home screen is served
by Google AdMob using the Google Mobile Ads SDK. The SDK may collect the
advertising ID, app set ID, IP address (used to estimate general location), app
interactions, and diagnostics for advertising, analytics, and fraud prevention.
Mira gathers UMP consent before initializing the SDK where required and offers a
privacy-choices button in Settings. Ads never appear in the browser, private
tabs, sheets, or Settings. Android backup is disabled.
```

### Section: Ads

**Yes.** Turn on the "Contains ads" label. Mira shows one adaptive banner on the
home screen, served by Google AdMob. It is not an ad-free app and must not be
labelled as one, even if the published catalog currently has the placement
switched off.

Before submitting, enable the banner in the published catalog and test with a
production build so the declaration matches what reviewers see. Test mode must
be off in the published configuration for a production submission; otherwise the
app only requests Google test ads. Ads never appear in the browser, private tabs,
sheets, or Settings. Where UMP requires consent, the app asks before the first
request and exposes the choice again in Settings.

### Section: App access

All functionality is available without special access:

```
No login, account, invite code, or location restriction. Open the app and browse.
```

### Section: Content declarations

| Declaration | Answer |
| --- | --- |
| Government app | No |
| Financial features | No |
| Health features | No |
| News app | No |
| COVID-19 contact tracing | No |
| Data safety | As above |
| Advertising ID | **Yes** — used for advertising, analytics, and fraud prevention by the Google Mobile Ads SDK |
| Photo/video permissions | Not requested |
| Location permissions | Not requested |
| Camera/microphone | Not requested |
| SMS/call log | Not requested |
| All files access | Not requested |
| Accessibility API | Not used |

---

## 5. Content rating questionnaire (IARC)

Category: **Utility, Productivity, Communication, or Other**.

Mira is a browser, so answer the "unrestricted web access" question truthfully:

| Question | Suggested answer | Why |
| --- | --- | --- |
| Does the app allow users to access the internet? | **Yes** | It is a browser |
| Does the app contain user-generated content? | **Yes** | Pages can contain comments, forums, and uploads; the app itself hosts none |
| Does the app allow users to interact or share information with other users? | **Yes** | Websites may offer this; Mira adds no social features of its own |
| Violence, sexuality, language, controlled substances | **No** for app-provided content | Mira ships no content of its own beyond curated links |
| Gambling, contests, or real-money purchases | **No** | No purchases, no gambling features |
| Does the app share the user's current location? | **No** | Location is blocked in the WebView and not requested |
| Does the app allow users to purchase digital goods? | **No** | No billing integration |
| Does the app contain ads? | **Yes** | One adaptive home-screen banner served by Google AdMob |

Expected outcome: **Teen** (or the regional equivalent) because of unrestricted
web access. Do not try to force a lower rating by hiding the browser behaviour;
that is the fastest route to a policy rejection.

---

## 6. Target audience and families

- **Target age group:** 13+.
- **Designed for families:** No.
- **Appeals to children:** No.
- **Teacher-approved:** No.

A general browser is not a child-directed product. Selecting an under-13 audience
would trigger Families policy requirements that Mira does not meet (content
filtering, verified parental consent, and a child-safe web experience). Keep the
audience at 13+.

---

## 7. Hosting the policy and catalog

### Privacy policy

`docs/privacy.html` is self-contained: no fonts, scripts, images, or analytics are
loaded from the network. Host the file at a stable public HTTPS URL and use that
exact URL in Play Console.

### Option A — GitHub Pages

1. Replace the contact placeholder in `docs/privacy.html` and `PRIVACY.md`.
2. Push the repository to GitHub.
3. Settings → Pages → Deploy from a branch → `main` / `/docs`.
4. The policy is at `https://<user>.github.io/<repo>/privacy.html`.

### Option B — Cloudflare Pages / Netlify / Vercel

Upload the `docs/` directory as a static site. No build command is required.
Set the output directory to `docs`.

### Option C — your own domain

Copy `docs/privacy.html` to `/privacy.html` on the domain you control. Keep the
URL stable; changing it later requires a Play Console update.

### Catalog admin (separate Next.js app)

The search presets, Today pages, and the home-screen ad configuration are edited
in `admin/`, a Next.js app that deploys independently of the mobile build.

The recommended production path is Docker Compose + Caddy on a VPS with
automatic HTTPS. The complete guide, including Atlas, DNS, backups, upgrades,
rollback, and monitoring, is in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

1. Create a MongoDB Atlas database (the free tier is enough) and add a database
   user with `readWrite` access to `mira`. Allow only the admin host's address.
2. On the VPS, copy `admin/.env.docker.example` to `admin/.env` and set
   `ADMIN_DOMAIN`, `ADMIN_PASSWORD` (8+ characters), `ADMIN_SESSION_SECRET`
   (32+ random characters), and `MONGODB_URI` (the Atlas SRV string).
3. Run `docker compose up -d --build` from `admin/`.
4. Verify `https://<domain>/api/health` returns `200` with `"storage": "ok"`.
5. Open `/`, sign in, edit the draft, and publish. The public feed is
   `https://<domain>/api/catalog`.
6. Put that URL in the Expo build environment as `EXPO_PUBLIC_CATALOG_URL`, then
   rebuild the app. An empty value keeps the app on its bundled catalog.

Vercel remains a supported alternative; see the deployment guide's Vercel
section.

The public feed is read-only, CORS-enabled, and cached for five minutes at the
edge. The admin stores the draft and published catalog in MongoDB Atlas; drafts
never reach the public feed until you press Publish. Local preview can use
`MIRA_DEV_FILE_STORE=1`; production requires `MONGODB_URI`. See
`admin/README.md`.

The catalog carries only public editorial and configuration data: engine names,
search URLs, page titles, links, categories, notes, reading times, whether the
banner is enabled, its layout, and its ad unit IDs. Never put personal data in
it.

### Before you publish

- [ ] Replace `REPLACE_WITH_YOUR_EMAIL@example.com` in **both** `PRIVACY.md` and
      `docs/privacy.html` with a monitored address.
- [ ] Replace `REPLACE_WITH_YOUR_DOMAIN` in this file with the real URL.
- [ ] Open the hosted page on a phone and in dark mode.
- [ ] Confirm the page loads with no network requests other than the document
      itself (browser dev tools → Network → reload).
- [ ] Paste the URL into Play Console → App content → Privacy policy.
- [ ] Deploy the catalog admin, publish a revision, and open `/api/catalog` to
      confirm the public feed.
- [ ] Set `EXPO_PUBLIC_CATALOG_URL` for the production build and confirm the app
      still opens with its bundled catalog when the feed is unreachable.
- [ ] Create the AdMob app entries for Android and iOS, replace the Google test app
      IDs in `app.json`, and create one adaptive banner unit per platform.
- [ ] Enter the real unit IDs in the admin Advertising tab, turn test mode off,
      enable the banner, and publish.
- [ ] Confirm the production build shows the real banner on Home and no banner in
      the browser, private tabs, sheets, or Settings.
- [ ] Check Settings → Advertising: the privacy-choices button appears where UMP
      requires it and reopens the consent form.

---

## 8. Build and submit

### One-time setup

```bash
npx eas-cli@latest login
npx eas-cli@latest init          # links this directory to an EAS project
```

`eas init` writes `extra.eas.projectId` into `app.json`. Commit that change.

### Test APK from GitHub Actions (no EAS account)

For tester builds, `.github/workflows/android-release.yml` builds a release APK
with Java 17 and the Android SDK, verifies its signature, and attaches it to a
GitHub Release when you push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Without signing secrets it uses Expo's debug key and is labeled sideload-only.
With `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD` it uses your upload key. Set the
repository variable `EXPO_PUBLIC_CATALOG_URL` so the test build reads the
production catalog. Full setup and troubleshooting:
[`docs/RELEASING.md`](docs/RELEASING.md).

The workflow produces `mira-<version>-<versionCode>.apk` plus a SHA-256 file. It
does not upload to Play.

### Development build (share extension, widget, capture shield, and AdMob)

Expo Go cannot load `expo-share-intent`, `react-native-android-widget`, or
`react-native-google-mobile-ads`, and the widget task handler is skipped there.
Use a development build:

```bash
npx eas-cli@latest build --profile development --platform android
```

Install the APK on a physical Android device. Then verify:

- Share a link from Chrome → Mira appears in the sheet → opens in a new tab.
- Share plain text → Mira opens the address overlay with the text prefilled.
- Long-press the home screen → Widgets → Mira → place the 4×2 widget.
- Resize the widget taller → shortcuts appear.
- Tap the widget's Today title → Mira opens the page.
- Switch system theme → widget redraws in dark mode.
- Open a private tab, try a screenshot and a screen recording → both are blocked,
  and the app-switcher preview is blank.
- Close all private tabs → screenshots work again and no private entry remains in
  history or trails.
- Enable ads in the admin with test mode on, publish, and refresh the app
  catalog → a label-marked Google test banner appears on Home.
- Open a page, a sheet, a private tab, and Settings → no banner appears.
- Return Home → the banner is requested again.
- In an EEA test locale, confirm the UMP form appears once, refusing consent
  suppresses the banner, and Settings → Advertising → Choices reopens the form.
- Replace the test app IDs and units only when you are ready to test live fill.

### Production build

```bash
npx eas-cli@latest build --profile production --platform android
```

This produces an `.aab`. EAS manages the upload keystore; back it up from the EAS
dashboard. Losing it means you cannot update the app under the same listing. If
you use Play App Signing, this is the upload key, not the app-signing key.

To build the `.aab` locally with the same upload key as the GitHub Actions APK,
use the Gradle path in
[`docs/RELEASING.md`](docs/RELEASING.md#5-build-the-play-bundle). Do not mix two
different upload keys under the same Play listing.

### Submit

```bash
npx eas-cli@latest submit --profile production --platform android
```

The `submit.production.android.track` is set to `internal` in `eas.json`. Promote
to closed testing, then production, from Play Console.

### Versioning

`eas.json` sets `"autoIncrement": true` for production, so EAS increments
`versionCode` on every production build. Bump `expo.version` (the user-visible
version) deliberately when the listing should show a new number.

The GitHub Actions APK uses the workflow run number as `versionCode` for
sideloaded test builds. That number is not a Play versioning strategy. For a
local Play bundle, set both values explicitly:

```bash
node scripts/ci/apply-version.mjs --version 1.2.0 --code 12
```

Play rejects a `versionCode` that was already uploaded, including on internal
and closed tracks. Keep the Play counter monotonic and independent of CI run
numbers.

---

## 9. Release checklist

### Code and configuration

- [x] `npx tsc --noEmit` passes.
- [x] `npx expo lint` passes.
- [x] `npx expo-doctor` passes 20/20.
- [x] `npx expo export --platform android` succeeds.
- [x] `usesCleartextTraffic: false`; `allowBackup: false`.
- [x] `INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE`, `WAKE_LOCK`, and
      `com.google.android.gms.permission.AD_ID` remain in the merged manifest for
      browsing and ads.
- [x] Camera, microphone, location, storage, contacts, SMS, notifications, and
      overlay permissions are blocked.
- [x] Android Safe Browsing enabled; WebView metrics opted out.
- [x] Private tabs bypass the page cache, write no history or trails, skip the
      discussion lookup, and block screen capture. Android shares cookies and site
      storage with normal tabs, and the UI says so.
- [x] `expo-screen-capture` installed; the shield degrades safely in builds and
      previews that lack the native module.
- [x] Share intent accepts `text/*` only.
- [x] Widget has a preview image and bundled fonts.
- [x] No analytics or crash-reporting SDK in `package.json`. Google Mobile Ads is
      the only ad SDK, and it initializes only after UMP consent.
- [x] One adaptive banner on Home only; it unmounts in the browser, private tabs,
      sheets, and Settings.
- [x] Search presets, Today pages, and ad settings load from a validated public
      catalog with a bundled fallback; the request carries no account, device ID,
      query, or browsing history.
- [x] `PRIVACY.md` and `docs/privacy.html` describe the shipped behaviour,
      including search-engine choice, the catalog request, and advertising.
- [x] `app.json` uses Google test app IDs until real AdMob apps are created.

### Store setup

- [ ] Replace the privacy contact placeholder.
- [ ] Host the privacy policy at a public HTTPS URL.
- [ ] Create the app in Play Console with package `com.mira.browser`.
- [ ] Upload the 512 × 512 icon.
- [ ] Upload the 1024 × 500 feature graphic.
- [ ] Upload the eight captures in `docs/play/screenshots/` in the listed order.
- [ ] Fill in the short and full descriptions.
- [ ] Complete Data safety: "shares Web browsing history" for the optional
      discussion lookup, plus the AdMob data types (approximate location, app
      interactions, device or other IDs, other app performance data) collected and
      shared with Google. Private-tab history is never written; private cookies
      are shared with normal tabs on Android.
- [ ] Complete the content rating questionnaire (unrestricted web access: yes,
      contains ads: yes).
- [ ] Set target audience to 13+ and "designed for families" to No.
- [ ] Declare "Contains ads" and "Advertising ID: Yes" in Play Console.
- [ ] Provide the app-access note (no login).
- [ ] Deploy the catalog admin, publish a revision with the production ad unit IDs,
      and set `EXPO_PUBLIC_CATALOG_URL` for the production build.
- [ ] Confirm the admin's `/api/health` returns `200` with `"storage": "ok"`, and
      that backups and uptime monitoring are configured
      ([`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)).
- [ ] Set the GitHub Actions variable `EXPO_PUBLIC_CATALOG_URL` and, if testers
      should receive stable updates, the four Android signing secrets. Push a
      test tag and install the resulting GitHub Release APK
      ([`docs/RELEASING.md`](docs/RELEASING.md)).
- [ ] Add a support email and (optionally) a website.
- [ ] Complete the "Government apps" and "Financial features" declarations.
- [ ] Upload the production `.aab` to internal testing.
- [ ] Add internal testers and install from the Play link.
- [ ] Promote to closed testing, then production.

### Device verification before production

- [ ] Cold start on a clean install, no dev menu, no red box.
- [ ] The native splash fades into the branded launch screen, then to Home, with
      no flash of the opposite theme and no blank content frame.
- [ ] Browse an HTTPS article; back/forward/reload work.
- [ ] Type an HTTP address; it upgrades to HTTPS.
- [ ] Try `file:///sdcard/` and `javascript:`; both are refused.
- [ ] Open a `mailto:` link; the mail app opens.
- [ ] Sign in to a site with first-party cookies; it works.
- [ ] Check that a third-party embed cannot set a cross-site cookie.
- [ ] Open five tabs; the sixth triggers eviction of the least-recent tab.
- [ ] Close the app and reopen; tabs are cleared, history and trails remain.
- [ ] Open a private tab; it starts empty and makes no request until an address is
      chosen.
- [ ] Browse in a private tab, then return home; no private page appears in
      Recent, Trails, or the tab titles.
- [ ] Sign in normally, open the same site in a private tab; the site recognizes
      you, confirming that Android's cookie store is shared. The private start
      page states this before an address is opened.
- [ ] Try a screenshot, a screen recording, and the app switcher while a private
      tab is open; all three are covered.
- [ ] Close all private tabs; the shield releases and normal screenshots work.
- [ ] Rename a trail, delete a trail, clear history.
- [ ] Share a link and plain text into Mira.
- [ ] Add, resize, tap, and theme-test the widget.
- [ ] With ads enabled and test mode on, confirm one labeled test banner on Home.
- [ ] Browse, open a sheet, open a private tab, and open Settings; confirm no
      banner is present in any of them.
- [ ] Return to Home and confirm the banner can request again.
- [ ] In a UMP-regulated test locale, refuse consent; confirm no ad request and
      no crash, then reopen Choices in Settings and grant consent.
- [ ] With ads disabled in the published catalog, refresh and confirm the slot
      disappears without leaving an empty gap.
- [ ] Toggle light/dark; both are legible.
- [ ] Rotate? Mira is portrait-only by design; confirm the listing says so.
- [ ] Verify the app launches with no network (offline error state is designed).

---

## 10. Notes for the Play reviewer

Paste this into "Notes for the reviewer" when submitting:

```
Mira is a general-purpose web browser. No account is required; every feature is
available on first launch.

To test browsing: tap the address field on the home screen, type "example.com",
and press Go. Use the toolbar for back, forward, reload, and the page menu.

To test tabs: open a page, tap the tab count in the toolbar, then "New tab".
Mira keeps up to five pages in memory.

To test private tabs: tap the mask icon on the home screen. The tab starts
empty. Type "example.com" and press Go. Private pages never enter history or
trails, and the page menu hides history, trails, and discussions. Android's
WebView shares cookies and site storage with normal tabs, and the private start
page states this before an address is opened. The tab sheet groups private pages
separately and offers "Close all private tabs". On a physical device,
screenshots and screen recordings are blocked while a private tab is open; the
app-switcher preview is blank.

To test trails: open two or three different sites, return home, and open the
latest trail card. Trails group pages visited within about 25 minutes.

To test search engines: return home and open Search settings from the menu. Pick
a different preset, then type a query in the address field. The chosen engine
opens the results. You can also add a custom HTTPS results URL containing %s;
it is stored only on the device.

To test Today's page: tap the large card on the home screen. The list is
published from a small public catalog and cached on the device; a bundled copy
is always available offline. The page itself is only requested when you tap it.

To test public discussions: open a well-known article that has appeared on Hacker
News, for example "https://frankchimero.com/blog/2015/the-webs-grain/". After it
loads, a small chip appears above the toolbar. Tap it to read the thread in the
sheet, switch platforms if a Lobsters thread exists, or tap "Open thread". The
feature is on by default and can be turned off at the bottom of the sheet.

To test the Android widget: long-press the home screen, choose Widgets, find Mira,
and place the widget. Tap the headline to open the page.

To test share intake: share a link from Chrome to Mira. The link opens in a new
tab.

Advertising: when the published catalog enables it, one adaptive banner appears
on the home screen, labeled ADVERTISEMENT. It is served by Google AdMob. It never
appears in the browser, private tabs, sheets, or Settings. Where UMP requires
consent, the app shows a consent form before the first request; the same choice
can be reopened from Settings → Advertising. The app requests INTERNET,
ACCESS_NETWORK_STATE, VIBRATE, WAKE_LOCK, and the advertising ID permission.
Camera, microphone, location, storage, contacts, SMS, and notification
permissions are removed from the manifest. Third-party cookies are disabled and
top-level browsing is HTTPS-only. The optional discussion lookup sends only the
current page address to the public Hacker News (Algolia) and Lobsters APIs; it
can be switched off in the app. The catalog request carries no account, device
ID, query, or browsing history.
```

If review asks about "unrestricted web access" or the content rating, point to the
browser use case and the Safe Browsing setting. Do not describe Mira as a
child-safe browser; it is not.

---

## 11. Known limitations to state honestly

- **Android only.** The iOS widget is not implemented; the iOS share extension is
  configured but has not been verified on a Mac.
- **Five tabs.** This is a deliberate memory bound, not a bug.
- **Private tabs hide Mira's traces, not network identity.** A private tab writes
  no history, bypasses the cache, and blocks capture, but Android shares cookies
  with normal tabs and the site still receives your IP address. Mira does not
  proxy or anonymise traffic.
- **The capture shield needs a native build.** Expo Go and the web preview show
  the app-switcher veil only; the OS-level block is active once
  `expo-screen-capture` is in the development or production binary.
- **No tab restoration across launches.** Tabs are in-memory; history and trails
  persist.
- **No built-in ad blocker.** Third-party cookies are off, but requests are not
  filtered.
- **One banner, home only.** Mira does not use interstitials, rewarded ads, or
  native ad units. The banner never appears in the browser, private tabs, sheets,
  or Settings, and a failed request leaves no empty slot.
- **The banner is remotely configured.** Whether it appears, its layout, and its
  unit IDs come from the published catalog. The app may keep the last cached
  configuration for about an hour when it cannot refresh.
- **Ads need a native build.** Expo Go and the web preview cannot load the AdMob
  SDK, so they show no banner at all.
- **No sync.** There is no account and no cloud.
- **Some sites refuse to load in a WebView** or require a custom tab / installed
  app. That is a site decision, not something Mira can override.
- **Web preview is not the product.** `BrowserPane.web.tsx` is an iframe fallback
  for design QA; many sites block framing.
- **The curated list is editorial and small.** Today's page is chosen from a
  published list, not a personalised feed. A bundled copy keeps it working
  offline; it does not learn from your reading.
- **Discussion matching is by address.** Mira canonicalises `http`/`https`,
  `www.`, trailing slashes, fragments, and common tracking parameters, but a
  thread posted with a substantially different URL will not match.
- **Discussions are read-only.** Mira shows the first 120 comments to six levels
  in a native sheet and opens the original thread for the rest; there is no
  voting or replying inside the app.
- **Lobsters is native-only.** The Lobsters API does not send CORS headers, so
  the desktop web preview skips it. The Android build queries both sources.

---

## 12. If Play rejects the release

The most likely objections, and the fix:

1. **Privacy policy unreachable or placeholder contact.**
   Host `docs/privacy.html`, replace the email, and resubmit. This is the most
   common avoidable rejection.
2. **Data safety mismatch.**
   The discussion lookup sends the current page address to Hacker News and
   Lobsters, so declare "shares Web browsing history" and mark it optional and
   ephemeral. The AdMob SDK collects approximate location (from IP), app
   interactions, device or other IDs, and diagnostics for advertising, analytics,
   and fraud prevention; declare those as collected and shared with Google. The
   catalog request carries no user data; do not declare it as browsing history.
3. **"Contains ads" or advertising ID mismatch.**
   Mira is not ad-free. Enable "Contains ads", declare the advertising ID, and
   submit a build whose published catalog actually enables the banner. Do not
   hide the placement behind test mode in production.
4. **Content rating understated.**
   A browser has unrestricted web access. Answer yes, accept the Teen rating, and
   keep Safe Browsing enabled.

Keep the review notes short and factual. Reviewers test what you tell them to
test; give them a path through the app that does not depend on a login or a
particular network.
