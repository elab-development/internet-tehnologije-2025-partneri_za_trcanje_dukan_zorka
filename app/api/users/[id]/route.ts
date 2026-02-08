import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = parseInt(idParam);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: 'Neispravan ID.' }, { status: 400 });
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id },
      select: {
        id: true,
        imePrezime: true,
        bio: true,
        slikaUrl: true,
        uloga: true,
        ukupnoPredjeniKm: true,
        organizovaneTrke: { select: { id: true } }
      }
    });

    if (!korisnik) {
      return NextResponse.json({ message: 'Korisnik ne postoji.' }, { status: 404 });
    }

    return NextResponse.json({
      ...korisnik,
      organizovaneTrkeCount: korisnik.organizovaneTrke.length
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
