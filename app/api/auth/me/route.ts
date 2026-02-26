import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';
import { ensureCsrfCookie } from '@/lib/csrf';

export async function GET() {
  try {
    const payload = await getAuthPayloadFromCookies();
    if (!payload) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, imePrezime: true, uloga: true, slikaUrl: true }
    });

    if (!korisnik) {
      return NextResponse.json({ message: 'Korisnik ne postoji.' }, { status: 404 });
    }

    const res = NextResponse.json({
      id: korisnik.id,
      email: korisnik.email,
      ime: korisnik.imePrezime,
      uloga: korisnik.uloga,
      slikaUrl: korisnik.slikaUrl
    }, { status: 200 });
    await ensureCsrfCookie(res);
    return res;
  } catch {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
