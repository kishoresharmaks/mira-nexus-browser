# Mira Privacy Policy

**Effective date:** 27 October 2026
**App:** Mira — a quieter browser (`com.mira.browser`)
**Platform:** Android

Mira is built to browse the web without building a profile of the person
browsing. This policy explains, in plain language, what the app stores, what it
sends over the network, and what it deliberately does not do.

## The short version

- Mira has no account, no analytics, no advertising, and no crash-reporting SDK.
- Your history, shortcuts, trails, and appearance choice are stored only on your
  device.
- Mira does not operate a server that receives your browsing activity.
- When you open a website, your device talks directly to that website, exactly
  as a browser does.
- When discussion lookup is on (the default), Mira sends the address of the
  page you are reading to Hacker News and Lobsters to find public threads. You
  can turn this off in the Discussions sheet.
- Nothing is backed up to a cloud by Mira. Android backup is disabled for the
  app.

## What Mira stores on your device

Mira uses Android's app-private storage. Other apps cannot read it. The data is
not sent to the developer or to any third party.

| Data | Purpose | Retention |
| --- | --- | --- |
| Browsing history (page title, address, time) | The Recent list and the History sheet | Last 100 pages, until you clear it |
| Trails (groups of pages visited within about 25 minutes) | The Trails shelf and the home-screen trail card | Up to 30 trails, 40 pages each, until you delete them or clear history |
| Shortcuts (title, address) | The home screen grid and the Android widget | Up to 12, until you remove them |
| Appearance preference (light/dark) | Keeps your chosen theme | Until you change it or uninstall |
| Discussion lookup preference (on/off) | Remembers whether Mira asks Hacker News and Lobsters about the current page | Until you change it or uninstall |
| Open tabs | In-memory only while the app is running | Cleared when Mira is closed |

There is no database in the cloud and no account to delete.

### How to delete it

- **History and trails:** open the page menu → History → Clear history. This
  clears both the history list and every trail.
- **A single trail:** open Trails → delete. You can rename or remove trails
  individually.
- **Shortcuts:** press and hold a shortcut on the home screen to remove it, or
  use Reset in the shortcuts section.
- **Everything:** Android Settings → Apps → Mira → Storage → Clear storage, or
  uninstall the app. Because Android backup is disabled, no copy remains in a
  Google backup.

## What Mira does not collect

Mira does not collect, transmit, sell, or share:

- your name, email address, phone number, or contacts;
- your precise or approximate location;
- your advertising ID or any other persistent device identifier;
- your browsing history, search terms, or a log of the pages you open (the
  optional, per-page discussion lookup is described under Network requests);
- crash logs, diagnostics, or usage analytics;
- photos, files, camera, microphone, or SMS content.

The app declares only the `INTERNET` permission (plus `VIBRATE` for haptic
feedback). Camera, microphone, location, contacts, storage, notifications, and
"display over other apps" permissions are explicitly removed from the Android
manifest.

## Network requests Mira makes

Mira is a browser, so it makes network requests when you ask it to.

1. **Websites you open.** The page is requested directly by your device from the
   site's server. That server receives the same information any browser would
   send: your IP address, the requested address, your user agent (which includes
   the app name and version), and cookies set by that site. The developer of
   Mira does not receive a copy.
2. **Search.** If you type words instead of an address, Mira opens a DuckDuckGo
   search results page (`https://duckduckgo.com/`). Your query is sent to
   DuckDuckGo under its own privacy policy. Search-result pages are not written
   to Mira's history.
3. **Favicons.** To show a site's own icon, Mira requests the icon directly from
   that site (for example `https://example.com/favicon.ico`). It does not use a
   third-party icon service, so the list of sites you visit is not sent to an
   icon provider.
4. **Today's page.** The daily reading list is bundled inside the app. Mira does
   not contact a server to choose it, and does not fetch the page until you tap
   it.
5. **Safe Browsing.** Android's WebView checks addresses against Google's Safe
   Browsing service so it can warn you about malware and phishing. That check is
   performed by the Android system and may send the address to Google; Mira does
   not receive, store, or transmit the result.
6. **Public discussions.** When "Look up discussions" is on (the default) and
   you open a page in the browser, Mira sends that page's address to two
   independent public services: Hacker News through the Algolia HN Search API
   (`https://hn.algolia.com/`) and Lobsters (`https://lobste.rs/`). They return
   public story scores, comment counts, and comments for that address. Mira
   sends no account, device identifier, search terms, or history of other
   pages. The answer is kept in memory for 15 minutes and is never written to
   history or trails. Turn the setting off in the Discussions sheet to stop these requests;
   the rest of the browser continues to work.

Mira contains no advertising SDK, no analytics SDK, and no social login.

## Cookies and site storage

Websites may set cookies and use local storage inside Mira's WebView, just as
they do in any browser. Those records belong to the website, are stored by
Android's WebView, and are not readable by the developer.

- Third-party cookies are disabled. A page cannot use embedded content to follow
  you across unrelated sites.
- First-party cookies remain enabled so that sign-ins and preferences work.
- Clearing history inside Mira clears Mira's lists. It does not clear website
  cookies. To remove those, use Android Settings → Apps → Mira → Storage →
  Clear storage.

## Sharing into Mira

Mira can receive a link or plain text from another app's share sheet. The shared
content is read on the device, validated, and opened or placed in the address
field. It is not uploaded anywhere. If the shared item is not a web link or
text, it is ignored. The share extension requests no access to photos, videos,
or files.

## Android home-screen widget

The widget shows Today's page and up to three of your shortcuts. It reads them
from Mira's local storage on the device. Tapping a widget item opens Mira through
a private `mira://` link. The widget does not contain an analytics SDK and does
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
- Discussion lookup is limited to the address of the page being read and can be
  turned off at any time.
- WebView metrics reporting to Google is opted out.
- Android backup is disabled, so local browsing data is not copied to Google
  Drive.
- Release builds are minified and shrunk, and WebView debugging is enabled only
  in development builds.

## Children

Mira is a general-purpose browser and is not directed to children under 13. It
does not knowingly collect personal information from anyone, including
children. Because Mira can open ordinary websites, parents and guardians should
supervise use in the same way they would with any browser.

## Changes to this policy

If this policy changes, the new version will be published at the same address
with a new effective date. Material changes will be noted in the app's release
notes.

## Contact

Questions about this policy or about data in Mira:

**REPLACE_WITH_YOUR_EMAIL@example.com**

This address must be replaced with a monitored contact before publishing to
Google Play.
