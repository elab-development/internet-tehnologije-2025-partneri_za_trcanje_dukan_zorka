import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthPayloadFromCookies } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';

export async function PATCH(req: Request) {
  try {
    const csrfError = await verifyCsrf(req);
    if (csrfError) {
      return csrfError;
    }

    const body = await req.json();
    const { ucesceId } = body;

    if (!ucesceId) {
      return NextResponse.json({ message: 'Fale podaci.' }, { status: 400 });
    }

    const auth = await getAuthPayloadFromCookies();
    if (!auth) {
      return NextResponse.json({ message: 'Nije prijavljen.' }, { status: 401 });
    }

    const organizerId = auth.id;

    const uId = Number(ucesceId);
    const oId = Number(organizerId);

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
      data: { status: 'PRIHVACENO' }
    });

    await prisma.obavestenje.create({
      data: {
        korisnikId: ucesce.korisnikId,
        tekst: `Tvoj zahtev za trku "${ucesce.trka.naziv}" je prihvaćen.`
      }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Greška.' }, { status: 500 });
  }
}
