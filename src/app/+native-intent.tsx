/**
 * Mira receives two kinds of system links:
 *
 *   mira://open?url=…        widget shortcut / today's page
 *   mira://dataUrl=…         the share extension's internal hand-off
 *
 * Both carry their payload in the URL itself, which the app reads with
 * `Linking.getInitialURL()` and the share-intent hook. Expo Router has no
 * `/open` or `/dataUrl` route, so letting it navigate would show the not-found
 * screen on top of the browser. Send every such link to the only screen the
 * app has; the payload is handled there.
 *
 * Development-client links must keep their own path so the launcher can load
 * a dev server.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  if (!path) return '/';

  try {
    const absolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(path);
    const parsed = new URL(absolute ? path : `mira://${path}`);

    const devClient =
      parsed.hostname.includes('expo-development-client') ||
      parsed.pathname.startsWith('/expo-development-client') ||
      parsed.pathname.startsWith('/--');

    if (devClient) return path;

    return '/';
  } catch {
    return '/';
  }
}
