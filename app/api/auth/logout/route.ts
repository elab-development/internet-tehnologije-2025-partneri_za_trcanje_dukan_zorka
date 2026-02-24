import { NextResponse } from 'next/server';
import { clearCsrfCookie, verifyCsrf } from '@/lib/csrf';

export async function POST(req: Request) {
  const csrfError = await verifyCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const res = NextResponse.json({ message: 'Odjavljen.' }, { status: 200 });
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });
  clearCsrfCookie(res);
  return res;
}
