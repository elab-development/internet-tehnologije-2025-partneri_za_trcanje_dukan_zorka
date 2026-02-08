import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { ucesceId, organizerId } = body;

    if (!ucesceId || !organizerId) {
      return NextResponse.json({ message: 'Fale podaci.' }, { status: 400 });
    }

    const uId = parseInt(ucesceId);
    const oId = parseInt(organizerId);

    const ucesce = await prisma.ucesce.findUnique({
      where: { id: uId },
      include: { trka: true, korisnik: true }
    });

    if (!ucesce) {
      return NextResponse.json({ message: 'Prijava ne postoji.' }, { status: 404 });
    }

    if (ucesce.trka.organizatorId !== oId) {
      return NextResponse.json({ message: 'Nemaš dozvolu.' }, { status: 403 });
    }

    const updated = await prisma.ucesce.update({
      where: { id: uId },
      data: { status: 'ODBIJENO' }
    });

    await prisma.obavestenje.create({
      data: {
        korisnikId: ucesce.korisnikId,
        tekst: `Tvoj zahtev za trku "${ucesce.trka.naziv}" je odbijen.`
      }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
