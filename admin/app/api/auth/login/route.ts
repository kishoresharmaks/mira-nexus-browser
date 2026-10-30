import { NextResponse } from 'next/server';
import {
  authConfigured,
  clearLoginFailures,
  clientKey,
  createSessionToken,
  loginRateLimited,
  passwordMatches,
  recordLoginFailure,
  SESSION_COOKIE,
  sessionExpiry,
  sameOrigin,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: 'Cross-origin request refused.' },
      { status: 403 },
    );
  }
  if (!authConfigured()) {
    return NextResponse.json(
      { error: 'Admin authentication is not configured.' },
      { status: 503 },
    );
  }

  const key = clientKey(request);
  if (loginRateLimited(key)) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in ten minutes.' },
      { status: 429 },
    );
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > 10_000) {
    return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Send a JSON body.' },
      { status: 400 },
    );
  }

  const password =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>).password
      : undefined;

  if (typeof password !== 'string' || password.length > 512) {
    recordLoginFailure(key);
    return NextResponse.json(
      { error: 'That password did not work.' },
      { status: 401 },
    );
  }

  if (!passwordMatches(password)) {
    recordLoginFailure(key);
    return NextResponse.json(
      { error: 'That password did not work.' },
      { status: 401 },
    );
  }

  clearLoginFailures(key);
  const token = createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: sessionExpiry(token),
  });
  return response;
}
