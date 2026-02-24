import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';

export async function POST(req: Request) {
  try {
    const csrfError = await verifyCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    const body = await req.json();
    const { trkaId } = body;

    if (!trkaId) {
      return NextResponse.json({ message: 'Fale podaci.' }, { status: 400 });
    }

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const korisnikId = auth.id;

    const existing = await prisma.ucesce.findFirst({
      where: {
        trkaId: Number(trkaId),
        korisnikId: Number(korisnikId)
      }
    });

    if (existing) {
      return NextResponse.json({ message: 'Već si prijavljen na ovu trku!' }, { status: 409 });
    }

    const trka = await prisma.trka.findUnique({
      where: { id: Number(trkaId) },
      include: { organizator: true }
    });

    if (!trka) {
      return NextResponse.json({ message: 'Trka ne postoji.' }, { status: 404 });
    }
    if (new Date(trka.vremePocetka) < new Date()) {
      return NextResponse.json({ message: 'Prijave za ovu trku su zatvorene.' }, { status: 400 });
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: Number(korisnikId) }
    });

    if (!korisnik) {
      return NextResponse.json({ message: 'Korisnik ne postoji.' }, { status: 404 });
    }

    const novoUcesce = await prisma.ucesce.create({
      data: {
        trkaId: Number(trkaId),
        korisnikId: Number(korisnikId),
      }
    });

    await prisma.obavestenje.create({
      data: {
        korisnikId: trka.organizatorId,
        tekst: `Novi zahtev za trku "${trka.naziv}" od ${korisnik.imePrezime}.`
      }
    });

    return NextResponse.json(novoUcesce, { status: 201 });

  } catch (error) {
    console.error("Greska join:", error);
    return NextResponse.json({ message: 'Greška na serveru.' }, { status: 500 });
  }
}
