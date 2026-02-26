import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const toOrigin = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const collectAllowedOrigins = (req: Request) => {
  const allowed = new Set<string>();

  const reqOrigin = toOrigin(req.url);
  if (reqOrigin) {
    allowed.add(reqOrigin);
  }

  const host = req.headers.get('host')?.split(',')[0]?.trim();
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const effectiveHost = forwardedHost || host;
  if (effectiveHost) {
    const proto = forwardedProto || (reqOrigin?.startsWith('https://') ? 'https' : 'http');
    allowed.add(`${proto}://${effectiveHost}`);
  }

  const publicAppOrigin = toOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (publicAppOrigin) {
    allowed.add(publicAppOrigin);
  }

  const trusted = process.env.CSRF_TRUSTED_ORIGINS;
  if (trusted) {
    for (const entry of trusted.split(',')) {
      const origin = toOrigin(entry.trim());
      if (origin) {
        allowed.add(origin);
      }
    }
  }

  return allowed;
};

export const setCsrfCookie = (res: NextResponse, token = generateCsrfToken()) => {
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_MAX_AGE_SECONDS
  });
  return token;
};

export const clearCsrfCookie = (res: NextResponse) => {
  res.cookies.set(CSRF_COOKIE_NAME, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });
};

export const ensureCsrfCookie = async (res: NextResponse) => {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (existing) {
    setCsrfCookie(res, existing);
    return existing;
  }
  return setCsrfCookie(res);
};

export const verifyCsrf = async (req: Request) => {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = req.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ message: 'CSRF token nije validan.' }, { status: 403 });
  }

  const origin = req.headers.get('origin');
  if (origin) {
    const normalizedOrigin = toOrigin(origin);
    const allowedOrigins = collectAllowedOrigins(req);
    if (!normalizedOrigin || !allowedOrigins.has(normalizedOrigin)) {
      return NextResponse.json({ message: 'Nevažeći Origin header.' }, { status: 403 });
    }
  }

  return null;
};
