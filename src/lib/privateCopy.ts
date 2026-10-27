import { Platform } from 'react-native';

/**
 * iOS gives an incognito WKWebView a non-persistent data store, so private tabs
 * are genuinely cookie-isolated there. Android's WebView has one app-wide cookie
 * and DOM-storage store. react-native-webview's `incognito` prop clears that
 * store globally on mount, so private tabs cannot use it on Android without
 * signing normal tabs out.
 *
 * Keep the copy aligned with the platform instead of promising isolation the
 * engine cannot provide.
 */
const privateCookiesIsolated = Platform.OS === 'ios';

export const privateCookieShort = privateCookiesIsolated
  ? 'cookies isolated'
  : 'cookies shared';

export const privateCookieTitle = privateCookiesIsolated
  ? 'A temporary cookie jar'
  : 'Cookies are shared';

export const privateCookieBody = privateCookiesIsolated
  ? 'Private tabs use a separate, non-persistent store. Their cookies and site storage are not shared with normal tabs and disappear when the private session ends.'
  : 'Android gives every tab one WebView cookie store. A site can recognize you from a normal tab, and signing in here can sign you in there. Closing the tab does not clear those cookies.';

export const privateCookieStartNote = privateCookiesIsolated
  ? 'Cookies stay in a temporary store and disappear when the private session ends.'
  : 'Cookies are shared with normal tabs on Android, so a site may remember this visit.';

export const privateCookieMenuMeta = `No history · ${privateCookieShort}`;
