import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    const korisnik = await prisma.korisnik.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, imePrezime: true, uloga: true }
    });

    if (!korisnik) {
      return NextResponse.json({ message: 'Korisnik ne postoji.' }, { status: 404 });
    }

    return NextResponse.json({
      id: korisnik.id,
      email: korisnik.email,
      ime: korisnik.imePrezime,
      uloga: korisnik.uloga
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
