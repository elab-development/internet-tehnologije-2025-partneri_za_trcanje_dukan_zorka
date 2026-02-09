import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trkaId, tekst, ocena } = body;

    if (!trkaId || !tekst || !ocena) {
      return NextResponse.json({ message: 'Fale podaci.' }, { status: 400 });
    }

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }
    const autorId = auth.id;

    const tId = Number(trkaId);
    const aId = Number(autorId);
    const rating = Number(ocena);

    if (Number.isNaN(tId) || Number.isNaN(aId) || Number.isNaN(rating)) {
      return NextResponse.json({ message: 'Neispravni podaci.' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ message: 'Ocena mora biti 1-5.' }, { status: 400 });
    }

    const trka = await prisma.trka.findUnique({ where: { id: tId } });
    if (!trka) return NextResponse.json({ message: 'Trka ne postoji.' }, { status: 404 });

    if (new Date(trka.vremePocetka) > new Date()) {
      return NextResponse.json({ message: 'Trka još nije završena.' }, { status: 400 });
    }

    const ucesce = await prisma.ucesce.findFirst({
      where: { trkaId: tId, korisnikId: aId, status: 'PRIHVACENO' }
    });

    if (!ucesce) {
      return NextResponse.json({ message: 'Nemaš pravo da komentarišeš ovu trku.' }, { status: 403 });
    }

    const existing = await prisma.komentar.findFirst({
      where: { trkaId: tId, autorId: aId }
    });

    if (existing) {
      return NextResponse.json({ message: 'Već si ostavio komentar.' }, { status: 409 });
    }

    const komentar = await prisma.komentar.create({
      data: { trkaId: tId, autorId: aId, tekst, ocena: rating }
    });

    return NextResponse.json(komentar, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
