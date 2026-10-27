import { isPrivateHostname, resolveInput, toSecureHttps } from './url';

export const MAX_INBOUND_LENGTH = 4_096;

export type InboundTarget =
  | {
      kind: 'navigate';
      url: string;
      title?: string;
      source: 'share' | 'link';
    }
  | {
      kind: 'compose';
      text: string;
      source: 'share';
    };

type SharedIntentLike = {
  webUrl?: string | null;
  text?: string | null;
  files?: unknown[] | null;
  meta?: { title?: string } | null;
};

function stripControl(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function cleanSharedTitle(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const title = stripControl(value).slice(0, 120);
  if (!title || /^https?:\/\//i.test(title)) return undefined;
  return title;
}

/**
 * Only web pages are allowed in. HTTP is upgraded to HTTPS, credentials in the
 * URL are rejected, and non-web schemes never reach the WebView.
 */
export function secureWebUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value || value.length > MAX_INBOUND_LENGTH) return null;

  try {
    const normalized = value.replace(
      /^([a-z][a-z0-9+.-]*):/i,
      (_, scheme: string) => `${scheme.toLowerCase()}:`,
    );
    const parsed = new URL(normalized);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:') {
      return null;
    }
    if (!parsed.hostname) return null;
    if (parsed.username || parsed.password) return null;
    if (/[\u0000-\u001f\u007f]/.test(value)) return null;

    // Cleartext is disabled at the Android network layer. Upgrade public
    // pages so a shared http link still has a chance to open.
    if (protocol === 'http:' && isPrivateHostname(parsed.hostname)) {
      return null;
    }

    return toSecureHttps(normalized);
  } catch {
    return null;
  }
}

export function extractUrlFromText(
  text: string | null | undefined,
): string | null {
  if (typeof text !== 'string') return null;
  const value = text.trim();
  if (!value || value.length > MAX_INBOUND_LENGTH) return null;

  const matches = value.match(/https?:\/\/[^\s<>"'`]+/gi) ?? [];
  for (const match of matches) {
    const candidate = match.replace(/[)\].,;!?]+$/g, '');
    const secure = secureWebUrl(candidate);
    if (secure) return secure;
  }

  const first = value.split(/\s+/, 1)[0];
  if (
    first &&
    /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d{1,5})?(?:[/?#]\S*)?$/i.test(
      first,
    )
  ) {
    const target = resolveInput(first);
    if (target?.kind === 'url') return secureWebUrl(target.url);
  }

  return null;
}

export function targetFromShare(
  intent: SharedIntentLike,
): InboundTarget | null {
  const title = cleanSharedTitle(intent.meta?.title);
  const url =
    secureWebUrl(intent.webUrl) ?? extractUrlFromText(intent.text);

  if (url) {
    return { kind: 'navigate', url, title, source: 'share' };
  }

  const text = stripControl(intent.text ?? '').slice(0, 280);
  if (text) {
    return { kind: 'compose', text, source: 'share' };
  }

  return null;
}

/**
 * Handles widget and deep links of the form:
 *   mira:///?url=https%3A%2F%2Fexample.com
 *   mira://open?url=https%3A%2F%2Fexample.com
 * The share extension's own `dataUrl=` link is intentionally ignored.
 */
export function targetFromDeepLink(raw: string | null | undefined): InboundTarget | null {
  if (typeof raw !== 'string' || !raw) return null;

  try {
    const link = new URL(raw);
    if (link.protocol.toLowerCase() !== 'mira:') return null;
    if (link.hostname && link.hostname !== 'open') return null;

    const candidate = link.searchParams.get('url');
    const url = secureWebUrl(candidate);
    if (!url) return null;

    return {
      kind: 'navigate',
      url,
      title: cleanSharedTitle(link.searchParams.get('title')),
      source: 'link',
    };
  } catch {
    return null;
  }
}
