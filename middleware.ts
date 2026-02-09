import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminApi = pathname.startsWith('/api/admin');
  const isAdminPage = pathname.startsWith('/admin');
  const isProfilePage = pathname.startsWith('/profile');

  if (!isAdminApi && !isAdminPage && !isProfilePage) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    if (isAdminApi) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ message: 'JWT secret nije podešen.' }, { status: 500 });
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const uloga = payload?.uloga as string | undefined;

    if ((isAdminApi || isAdminPage) && uloga !== 'ADMIN') {
      if (isAdminApi) {
        return NextResponse.json({ message: 'Nemaš pristup.' }, { status: 403 });
      }
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    if (isAdminApi) {
      return NextResponse.json({ message: 'Neispravan token.' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/profile', '/admin', '/api/admin/:path*'],
};
