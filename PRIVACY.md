# Nexus Privacy Policy

**Effective date:** 31 October 2026
**App:** Nexus — A Quieter Browser (`com.nexus.browser`)
**Platform:** Android

Nexus is built to browse the web without building a profile of the person
browsing. This policy explains, in plain language, what the app stores, what it
sends over the network, and what it deliberately does not do, including the one
optional home-screen banner served by Google AdMob.

## The short version

- Nexus has no account, no analytics, and no crash-reporting SDK. It can show one
  small banner on the home screen, served by Google AdMob.
- Ads never appear in the browser, in private tabs, in sheets, or in Settings.
  Google may use your advertising ID and ad interactions to serve and measure
  that banner; you can review your choices under Advertising in Settings where
  your region requires it.
- Your history, shortcuts, trails, search-engine choice, and appearance choice
  are stored only on your device.
- Nexus does not operate a server that receives your browsing activity. It hosts
  one public catalog of search presets and Today pages; the app fetches that
  catalog without an account, device ID, search query, or browsing history.
- When you open a website, your device talks directly to that website, exactly
  as a browser does.
- When discussion lookup is on (the default), Nexus sends the address of the
  page you are reading to Hacker News and Lobsters to find public threads. You
  can turn this off in the Discussions sheet. Private tabs never trigger this
  lookup.
- Private tabs leave no history or trails, bypass WebView's page cache, and
  block screen capture. Android's WebView shares cookies and site storage with
  normal tabs, so a site may still recognize you.
- Nothing is backed up to a cloud by Nexus. Android backup is disabled for the
  app.

## What Nexus stores on your device

Nexus uses Android's app-private storage. Other apps cannot read it. The data is
not sent to the developer or to any third party.

| Data | Purpose | Retention |
| --- | --- | --- |
| Browsing history (page title, address, time) | The Recent list and the History sheet | Last 100 pages, until you clear it |
| Trails (groups of pages visited within about 25 minutes) | The Trails shelf and the home-screen trail card | Up to 30 trails, 40 pages each, until you delete them or clear history |
| Shortcuts (title, address) | The home screen grid and the Android widget | Up to 12, until you remove them |
| Appearance preference (light/dark) | Keeps your chosen theme | Until you change it or uninstall |
| Discussion lookup preference (on/off) | Remembers whether Nexus asks Hacker News and Lobsters about the current page | Until you change it or uninstall |
| Search choice and custom engines (name, search URL) | Remembers which engine handles typed searches; engines you add stay on this device | Until you change the choice, remove the engine, or uninstall |
| Ad consent choices (UMP) | Google's consent SDK stores your advertising consent on the device so Nexus does not ask on every launch | Until you change your choice, clear app storage, or uninstall |
| Cached catalog (search presets, Today pages, and ad settings) | Lets Nexus open with the last published lists and ad configuration when the catalog endpoint is unreachable | Until a newer catalog replaces it or you clear app storage |
| Open tabs | In-memory only while the app is running | Cleared when Nexus is closed |
| Private tab cookies and site storage | Keeps sites working while you browse; Android's WebView shares one store across all tabs | Until the site expires them or you clear app storage |

There is no account to delete, and Nexus does not store your browsing data in
the cloud. The hosted catalog database contains only public editorial and
configuration data: engine names, search URLs, page titles, links, categories,
notes, reading times, whether the home banner is enabled, its layout, and its
ad unit IDs. It has no reader account, device ID, query, or browsing history.
Private tabs write no history, trails, or page state; their cookies and site
storage are not isolated from normal tabs.

### How to delete it

- **History and trails:** open the page menu → History → Clear history. This
  clears both the history list and every trail.
- **A single trail:** open Trails → delete. You can rename or remove trails
  individually.
- **Shortcuts:** press and hold a shortcut on the home screen to remove it, or
  use Reset in the shortcuts section.
- **Private tabs:** close each tab, or use Close all private tabs in the tab
  sheet. This closes the pages and drops their in-memory state. Cookies set by
  sites remain in Android's shared WebView store until they expire; to remove
  them, use Clear storage below. All private tabs also disappear when Nexus
  closes.
- **Everything:** Android Settings → Apps → Nexus → Storage → Clear storage, or
  uninstall the app. Because Android backup is disabled, no copy remains in a
  Google backup.

## What Nexus does not collect

The developer does not collect, receive, sell, or share:

- your name, email address, phone number, or contacts;
- your precise or approximate location;
- your advertising ID, app set ID, or other persistent device identifiers —
  Google's ad SDK can access these on your device for the home-screen banner, as
  described under Advertising, but Nexus itself does not read or transmit them;
- your browsing history, search terms, or a log of the pages you open (the
  optional, per-page discussion lookup is described under Network requests);
- crash logs, diagnostics, or usage analytics;
- photos, files, camera, microphone, or SMS content.

The app's merged Android manifest declares `INTERNET` and
`ACCESS_NETWORK_STATE` for browsing and ad delivery, `VIBRATE` for haptic
feedback, `WAKE_LOCK`, which the Google Mobile Ads SDK uses to keep a request
alive, and `com.google.android.gms.permission.AD_ID` for advertising ID access.
Camera, microphone, location, contacts, storage, notifications, and "display
over other apps" permissions are explicitly removed from the Android manifest.

The catalog request does not identify you: it carries no account, device ID,
search terms, or history. The hosting provider may process standard request logs
such as an IP address and user agent to serve and protect the endpoint; Nexus
does not use those logs to build a profile or to personalise the catalog.

## Network requests Nexus makes

Nexus is a browser, so it makes network requests as part of ordinary use.

1. **Websites you open.** The page is requested directly by your device from the
   site's server. That server receives the same information any browser would
   send: your IP address, the requested address, your user agent (which includes
   the app name and version), and cookies set by that site. The developer of
   Nexus does not receive a copy.
2. **Search.** If you type words instead of an address, Nexus opens a results
   page for the engine selected in Search settings. The default is DuckDuckGo
   (`https://duckduckgo.com/`); you can choose another preset or add a custom
   HTTPS search URL that contains `%s`. Your query is sent to that engine under
   its own privacy policy. Nexus does not send the query to its catalog server.
   Search-result pages are not written to Nexus's history.
3. **Catalog.** Nexus fetches a small, public catalog of search presets and
   Today pages from a hosted HTTPS endpoint. The request is a plain read: it
   carries no account, device identifier, search query, or browsing history.
   Standard request logs at the hosting provider may include an IP address and
   user agent for security and reliability; Nexus does not use them to profile
   readers. Nexus validates the response, caches it for about an hour, and falls
   back to the copy bundled inside the app if the endpoint is unreachable or
   malformed. You can trigger a check yourself in Search settings.
4. **Favicons.** To show a site's own icon, Nexus requests the icon directly from
   that site (for example `https://example.com/favicon.ico`). It does not use a
   third-party icon service, so the list of sites you visit is not sent to an
   icon provider.
5. **Today's page.** The daily reading list comes from the same public catalog
   described above. Nexus does not contact a server to choose a day's page beyond
   that catalog fetch, and does not fetch the page itself until you tap it. If
   the catalog has never been downloaded, the bundled list is used.
6. **Safe Browsing.** Android's WebView checks addresses against Google's Safe
   Browsing service so it can warn you about malware and phishing. That check is
   performed by the Android system and may send the address to Google; Nexus does
   not receive, store, or transmit the result.
7. **Public discussions.** When "Look up discussions" is on (the default) and
   you open a page in a normal tab, Nexus sends that page's address to two
   independent public services: Hacker News through the Algolia HN Search API
   (`https://hn.algolia.com/`) and Lobsters (`https://lobste.rs/`). They return
   public story scores, comment counts, and comments for that address. Nexus
   sends no account, device identifier, search terms, or history of other
   pages. The answer is kept in memory for 15 minutes and is never written to
   history or trails. Private tabs never make this request. Turn the setting off
   in the Discussions sheet to stop these requests; the rest of the browser
   continues to work.
8. **Advertising.** When the published catalog enables ads, the home screen asks
   Google AdMob for one banner. That request goes to Google, not to the
   developer. See Advertising below for what it can include and how consent
   works.

Nexus contains no analytics SDK and no social login. The only third-party SDK
that can transmit data is the Google Mobile Ads SDK described under Advertising.

## Advertising

Nexus can show one adaptive banner on the home screen, served by Google AdMob. It
is the only advertising in the app, and it is off unless the published catalog
enables it.

- **Where it appears.** Between Today's page and Trails, or pinned above the
  bottom safe area, depending on the published layout. It never appears in the
  browser, in a private tab, in a sheet, in Settings, or on the private start
  page. Leaving the home screen unmounts the banner and stops its request.
- **What is requested.** Nexus asks Google for one banner using a unit ID from
  the published catalog. The request can include the advertising ID, app set
  ID, IP address, device and app information, and ad interaction information
  such as app launches and taps. Google may use the IP address to estimate
  general location. Nexus does not send your history, trails, search terms, open
  tabs, or the address of the page you are reading to the ad SDK.
- **Consent.** Before the SDK initializes, Nexus runs Google's User Messaging
  Platform (UMP) consent flow and, on iOS, asks for App Tracking Transparency
  permission. If you do not consent, Nexus does not request ads. Where Google
  requires it, Settings → Advertising shows a Choices button that reopens the
  consent form so you can change or withdraw your choice at any time.
- **Your advertising ID.** The Google Mobile Ads SDK can access Android's
  advertising ID and app set ID for ad delivery, measurement, and fraud
  prevention. You can reset or delete the advertising ID in Android Settings →
  Privacy → Ads. Nexus itself does not read, store, or transmit it.
- **Content rating.** Nexus configures the SDK with a maximum ad content rating
  of Teen (`MaxAdContentRating.T`).
- **Test mode.** While test mode is on, or in any development build, Nexus
  requests Google's test banner instead of paid inventory.
- **Not a sale by the developer.** The developer does not sell personal
  information. Google handles ad data under its own privacy policy:
  <https://policies.google.com/technologies/partner-sites>.

## Cookies and site storage

Websites may set cookies and use local storage inside Nexus's WebView, just as
they do in any browser. Those records belong to the website, are stored by
Android's WebView, and are not readable by the developer.

- Third-party cookies are disabled. A page cannot use embedded content to follow
  you across unrelated sites.
- First-party cookies remain enabled so that sign-ins and preferences work.
- Android's WebView has one cookie and site-storage store for the whole app. A
  private tab uses that same store: cookies set in a private tab can be seen by
  normal tabs, and a site you are signed in to in a normal tab may already
  recognize you in a private tab. Closing a private tab does not clear those
  cookies.
- Private tabs still write no history or trails, bypass the page cache, and skip
  discussion lookup.
- Clearing history inside Nexus clears Nexus's lists. It does not clear
  normal-tab website cookies. To remove those, use Android Settings → Apps →
  Nexus → Storage → Clear storage.

## Private tabs

A private tab is a temporary browsing room. It leaves no record in Nexus, but on
Android it is not a separate cookie jar.

- **No history or trails.** Pages opened in a private tab are never written to
  Nexus's history, Recent list, or Trails. The omnibox hides stored history while
  you are in a private tab.
- **No page cache.** Private requests are made with WebView's page cache
  bypassed, so Nexus does not reuse saved copies of pages.
- **Cookies are shared on Android.** Android's WebView keeps one cookie and
  site-storage store for every tab. A private tab does not isolate that store:
  a site can recognize you from a normal tab, signing in here can sign you in
  there, and closing the tab does not clear those cookies. Use Android Settings
  → Apps → Nexus → Storage → Clear storage to remove them.
- **No discussion lookup.** Nexus does not send a private tab's address to Hacker
  News or Lobsters.
- **No screen capture.** While a private tab is open, Nexus asks Android to block
  screenshots and screen recordings and to blank the app-switcher preview. On
  devices or builds where the native shield is unavailable, Nexus covers the app
  with a quiet screen instead.
- **Still a browser.** A website you open still receives your IP address, the
  requested address, and your user agent, and can set cookies in the shared
  store. Private tabs do not encrypt, proxy, or anonymise traffic, and they are
  not a VPN or Tor.
- **Closing all private tabs closes their pages.** Private tabs are held in
  memory only and do not survive closing Nexus. Closing them does not clear
  cookies or site storage, because Android shares those with normal tabs.

## Sharing into Nexus

Nexus can receive a link or plain text from another app's share sheet. The shared
content is read on the device, validated, and opened or placed in the address
field. It is not uploaded anywhere. If the shared item is not a web link or
text, it is ignored. The share extension requests no access to photos, videos,
or files.

## Android home-screen widget

The widget shows Today's page and up to three of your shortcuts. It reads them
from Nexus's local storage on the device. Tapping a widget item opens Nexus through
a private `nexus://` link. The widget does not contain an analytics SDK and does
not send data anywhere.

## Security measures

- Only `https://` pages may become the top-level document. Public `http://`
  links are upgraded to HTTPS; cleartext traffic is disabled at the Android
  network layer.
- The WebView cannot read local files (`file://`), and file access, file-URL
  access, and form-data saving are disabled.
- Mixed content is never allowed.
- Geolocation and camera/microphone capture are denied.
- External app schemes are limited to `mailto:`, `tel:`, `sms:`, and `geo:`.
  A web page cannot launch an arbitrary Android activity.
- Android Safe Browsing stays enabled for malware and phishing warnings.
- Discussion lookup is limited to the address of the page being read, can be
  turned off at any time, and never runs in a private tab.
- Ads initialize only after Google's UMP consent flow resolves; if consent does
  not permit ad requests, Nexus requests none. The banner exists only on the home
  screen, unmounts while you browse, and is never placed in a private tab, a
  sheet, or Settings. Ad content is capped at a Teen rating.
- The catalog feed is public, read-only, and fetched over HTTPS. Nexus validates
  it, caches it, and falls back to the bundled copy when it is missing, malformed,
  or unreachable.
- Private tabs write no history or trails, bypass the page cache, and never run
  discussion lookup. Android's WebView shares cookies and site storage with
  normal tabs; see Cookies and site storage.
- While a private tab is open, the Android window uses `FLAG_SECURE` to block
  screenshots and screen recordings and to blank the app-switcher preview.
- WebView metrics reporting to Google is opted out.
- Android backup is disabled, so local browsing data is not copied to Google
  Drive.
- Release builds are minified and shrunk, and WebView debugging is enabled only
  in development builds.

## Children

Nexus is a general-purpose browser and is not directed to children under 13. It
does not knowingly collect personal information from anyone, including
children. Ad content is capped at a Teen rating, and Nexus does not ask the ad SDK
to treat the app as child-directed. Because Nexus can open ordinary websites,
parents and guardians should supervise use in the same way they would with any
browser.

## Changes to this policy

If this policy changes, the new version will be published at the same address
with a new effective date. Material changes will be noted in the app's release
notes.

## Contact

Questions about this policy or about data in Nexus:

**krishkishoreks@gmail.com**

This address must be replaced with a monitored contact before publishing to
Google Play.
