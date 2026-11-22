import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'nexus_catalog_session';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_MIN_LENGTH = 8;
const SECRET_MIN_LENGTH = 32;

type Attempt = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, Attempt>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? '';
}

function configuredPassword(): string {
  return process.env.ADMIN_PASSWORD ?? '';
}

/**
 * Both values are required. The password is compared by digest so length does
 * not leak through timing; the secret signs the only cookie the admin keeps.
 */
export function authConfigured(): boolean {
  return (
    configuredPassword().length >= PASSWORD_MIN_LENGTH &&
    sessionSecret().length >= SECRET_MIN_LENGTH
  );
}

export function authConfigurationSummary(): {
  password: boolean;
  secret: boolean;
} {
  return {
    password: configuredPassword().length >= PASSWORD_MIN_LENGTH,
    secret: sessionSecret().length >= SECRET_MIN_LENGTH,
  };
}

export function passwordMatches(input: string): boolean {
  const configured = configuredPassword();
  if (!configured) return false;
  const given = createHash('sha256').update(input).digest();
  const expected = createHash('sha256').update(configured).digest();
  return timingSafeEqual(given, expected);
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('base64url');
}

export function createSessionToken(now = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = `v1.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(
  token: string | undefined,
  now = Date.now(),
): boolean {
  if (!token || !authConfigured()) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;

  const expiresAt = Number(parts[1]);
  if (
    !Number.isInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + MAX_SESSION_TTL_MS
  ) {
    return false;
  }

  const expected = Buffer.from(sign(`v1.${expiresAt}`), 'utf8');
  const given = Buffer.from(parts[2], 'utf8');
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function sessionExpiry(token: string): Date {
  const expiresAt = Number(token.split('.')[1]);
  return new Date(Number.isFinite(expiresAt) ? expiresAt : Date.now());
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export function isAuthorizedBearer(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return verifySessionToken(token);
  }
  return false;
}

export async function isAuthorized(request: Request): Promise<boolean> {
  if (isAuthorizedBearer(request)) return true;
  return isAuthenticated();
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'local';
}

export function loginRateLimited(key: string, now = Date.now()): boolean {
  const attempt = attempts.get(key);
  if (!attempt) return false;
  if (now >= attempt.resetAt) {
    attempts.delete(key);
    return false;
  }
  return attempt.count >= MAX_ATTEMPTS;
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  const attempt = attempts.get(key);
  if (!attempt || now >= attempt.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  attempt.count += 1;
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}

/**
 * Browsers send Origin on state-changing requests. Reject a mismatch rather
 * than relying on the cookie alone, even though the cookie is SameSite=Lax.
 *
 * Behind a reverse proxy (InstaBox + Caddy), the `Host` header is rewritten to
 * the internal upstream address, while `X-Forwarded-Host` holds the host the
 * client actually used — which is what the `Origin` header reflects. Prefer
 * `X-Forwarded-Host` so the check works correctly behind a proxy.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    const originHost = new URL(origin).host.toLowerCase();
    if (host && originHost === host.toLowerCase()) return true;

    // Allow configured ADMIN_DOMAIN (e.g. mira.nexusnation.in when behind Cloudflare proxying to Instabox)
    const adminDomain = process.env.ADMIN_DOMAIN?.toLowerCase().trim();
    if (adminDomain && (originHost === adminDomain || host?.toLowerCase() === adminDomain)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
