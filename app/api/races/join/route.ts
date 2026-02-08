import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trkaId, korisnikId } = body;

    if (!trkaId || !korisnikId) {
      return NextResponse.json({ message: 'Fale podaci.' }, { status: 400 });
    }

    const existing = await prisma.ucesce.findFirst({
      where: {
        trkaId: parseInt(trkaId),
        korisnikId: parseInt(korisnikId)
      }
    });

    if (existing) {
      return NextResponse.json({ message: 'Već si prijavljen na ovu trku!' }, { status: 409 });
    }

    const trka = await prisma.trka.findUnique({
      where: { id: parseInt(trkaId) },
      include: { organizator: true }
    });

    if (!trka) {
      return NextResponse.json({ message: 'Trka ne postoji.' }, { status: 404 });
    }

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: parseInt(korisnikId) }
    });

    if (!korisnik) {
      return NextResponse.json({ message: 'Korisnik ne postoji.' }, { status: 404 });
    }

    const novoUcesce = await prisma.ucesce.create({
      data: {
        trkaId: parseInt(trkaId),
        korisnikId: parseInt(korisnikId),
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
